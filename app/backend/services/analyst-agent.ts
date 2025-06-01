import { config } from '../config';
import { agentManager } from './letta/letta-agents';
import { agentService } from './agent';
import * as templates from '../data/prompt';

const MEMORY_BLOCK_LABEL = config.analystAgent.cryptoNewsMemoryBlockLabel;
const MAX_MEMORY_LENGTH = 6000;
const DELAY_BETWEEN_FETCHES = 8 * 60 * 60 * 1000; // 8 hours
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms

class AnalystAgentService {
  private timer: NodeJS.Timeout | null = null;
  private mainAgentId: string | null = null;

  constructor() {
    console.log('🔍 Analyst Agent constructor');
  }

  // Cryptopanic cache
  private cryptopanicCache: { data: string; timestamp: number } | null = null;

  public async isEnabled() {
    const agentId = await this.getOrCreateAnalystAgent();
    const agent = await agentService.get(agentId);
    const enabled = agent && agent.status === 'enabled';
    console.log('🔍 Analyst Agent status:', enabled);
    return enabled;
  }

  public async enable() {
    const agentId = await this.getOrCreateAnalystAgent();
    const agent = await agentService.get(agentId);
    if (agent && agent.status !== 'enabled') {
      await agentService.update({ ...agent, status: 'enabled' });
    }
    this.start();
    console.log('🔍 Analyst Agent enabled');
  }

  public async disable() {
    const agentId = await this.getOrCreateAnalystAgent();
    const agent = await agentService.get(agentId);
    if (agent && agent.status !== 'disabled') {
      await agentService.update({ ...agent, status: 'disabled' });
    }
    await this.clearMemoryBlock();
    this.stop();
    console.log('🔍 Analyst Agent disabled');
  }

  private clearMemoryBlock() {
    if (!this.mainAgentId) return;
    console.log('🔍 Clearing memory block for Agent:', this.mainAgentId);
    agentManager.updateMemoryBlock(this.mainAgentId, MEMORY_BLOCK_LABEL, '');
  }

  public async setMainAgentId(agentId: string) {
    this.mainAgentId = agentId;
    console.log('🔍 Main agent ID set for Analyst Agent:', this.mainAgentId);
  }

  // TODO: improve the order of the data (most recent news first) when updating
  public async fetchAndStore() {
    console.log('🔍 Fetching and storing Cryptopanic data');
    if (!this.mainAgentId) return;
    const agent = await agentService.get(this.mainAgentId);
    if (!agent || agent.status !== 'enabled') return;
    try {
      const data = await this.fetchCryptopanicData();
      const memoryBlockHeader = 'Crypto news:\n';
      // Get current memory block
      let currentBlock = await agentManager.getMemoryBlock(this.mainAgentId, MEMORY_BLOCK_LABEL);
      let existingTitles = new Set<string>();
      if (currentBlock && currentBlock.startsWith(memoryBlockHeader)) {
        const lines = currentBlock.slice(memoryBlockHeader.length).split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('- ')) {
            existingTitles.add(trimmed.substring(2));
          }
        }
      }
      // Parse new data
      const newTitles = data.split('\n').map(l => l.trim()).filter(l => l.startsWith('- ')).map(l => l.substring(2));
      // Add only unique new titles
      const allTitles = Array.from(existingTitles);
      for (const title of newTitles) {
        if (!existingTitles.has(title)) {
          allTitles.push(title);
        }
      }
      // Rebuild memory block
      let value = memoryBlockHeader + allTitles.map(t => `- ${t}`).join('\n');
      if (value.length > MAX_MEMORY_LENGTH) {
        // Truncate to fit max length, keeping header and as many items as possible
        let truncated = memoryBlockHeader;
        for (const t of allTitles) {
          const nextLine = `- ${t}\n`;
          if ((truncated + nextLine).length > MAX_MEMORY_LENGTH) break;
          truncated += nextLine;
        }
        value = truncated.trimEnd();
      }
      await agentManager.updateMemoryBlock(this.mainAgentId, MEMORY_BLOCK_LABEL, value);
    } catch (err) {
      console.error('AnalystAgent fetch/store error:', err);
    }
  }

  private async fetchCryptopanicData(): Promise<string> {
    console.log('🔍 Fetching Cryptopanic data');
    const now = Date.now();
    if (this.cryptopanicCache && (now - this.cryptopanicCache.timestamp < CACHE_DURATION)) {
      console.log('🔍 Returning cached Cryptopanic data');
      return this.cryptopanicCache.data;
    }
    const url = `https://cryptopanic.com/api/developer/v2/posts/?auth_token=${config.cryptopanic.apiKey}&public=true&filter=important&kind=news&regions=en`;
    const res = await fetch(url);
    if (!res.ok) {
      const error = await res.json();
      console.error('Cryptopanic API error:', error);
      throw new Error(`Cryptopanic API error: ${error.message}`);
    }
    const json = await res.json();
    // Simple summary: join titles
    const data = (json.results || []).map((item: any) => `- ${item.title}`).join('\n');
    this.cryptopanicCache = { data, timestamp: now };
    return data;
  }

  public async start() {
    const agentId = await this.getOrCreateAnalystAgent();
    const agent = await agentService.get(agentId);
    const enabled = agent && agent.status === 'enabled';
    console.log('🔍 Analyst Agent enabled:', enabled);
    if (!enabled) {
      console.log('🔍 Analyst Agent is disabled, not starting');
      return;
    }
    console.log('🔍 Starting Analyst Agent');
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.fetchAndStore(), DELAY_BETWEEN_FETCHES);
    // Initial fetch
    this.fetchAndStore();
  }

  public stop() {
    console.log('🔍 Stopping Analyst Agent');
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * Get or create the Analyst Agent
   * IMPORTANT: This is only so the users can enable/disable the Analyst Agent
   * but the prompt is not used, and the tools + triggers are not available (hardcoded here).
   * @returns The ID of the Analyst Agent
   */
  public async getOrCreateAnalystAgent() {
    const agentName = 'analyst-agent';
    let agent = (await agentService.list()).find(a => a.details.name === agentName);
    if (agent && agent.id) return agent.id;
    const newAgent = agentService.buildAgentConfig({
      name: agentName,
      description: templates.analystAgentDescription,
      systemPrompt: templates.analystAgentPrompt,
      persona: '',
      model: config.model.modelConfig,
    });
    newAgent.status = 'disabled';
    const lettaId = await agentService.getOrCreateLettaAgent(newAgent, {
      memoryBlocks: [
        { label: 'crypto-news', value: config.analystAgent.cryptoNewsMemoryBlockLabel, limit: 6000 },
      ],
    });
    await agentService.create({ ...newAgent, id: lettaId, status: 'enabled' });
    return lettaId;
  }
}

export const analystAgent = new AnalystAgentService(); 