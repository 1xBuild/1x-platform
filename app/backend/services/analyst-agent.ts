import { config } from '../config';
import { agentManager } from './letta/letta-agents';
import { agentService } from './agent';
import * as templates from '../data/prompt';

const MEMORY_BLOCK_LABEL = config.analystAgent.cryptoNewsMemoryBlockLabel;
const MAX_MEMORY_LENGTH = 6000;
const DELAY_BETWEEN_FETCHES = 8 * 60 * 60 * 1000; // 8 hours
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms

export interface CryptopanicData {
  next: any
  previous: any
  results: Result[]
}

export interface Result {
  id: number
  slug: string
  title: string
  description: string
  published_at: string
  created_at: string
  kind: string
}


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
      const newsItems = await this.fetchCryptopanicData();
      // Group news by date
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const formatDate = (d: Date) => d.toISOString().slice(0, 10);
      const todayStr = formatDate(today);
      const yesterdayStr = formatDate(yesterday);
      const grouped: Record<string, Result[]> = {};
      for (const item of newsItems) {
        const date = item.published_at ? item.published_at.slice(0, 10) : '';
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(item);
      }
      // Sort dates descending (most recent first)
      const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
      // Build memory block
      let value = '';
      let totalLength = 0;
      for (const date of sortedDates) {
        let sectionHeader = '';
        if (date === todayStr) {
          sectionHeader = `Crypto news - today - ${date}\n`;
        } else if (date === yesterdayStr) {
          sectionHeader = `Crypto news - yesterday - ${date}\n`;
        } else {
          sectionHeader = `Crypto news - ${date}\n`;
        }
        if (totalLength + sectionHeader.length > MAX_MEMORY_LENGTH) break;
        value += sectionHeader;
        totalLength += sectionHeader.length;
        for (const item of grouped[date]) {
          const newsBlock = `-\nDate: ${item.published_at.slice(0, 10)}\nTitle: ${item.title}\nDesc: ${item.description || ''}\n`;
          if (totalLength + newsBlock.length > MAX_MEMORY_LENGTH) {
            value = value.trimEnd();
            await agentManager.updateMemoryBlock(this.mainAgentId, MEMORY_BLOCK_LABEL, value);
            return;
          }
          value += newsBlock;
          totalLength += newsBlock.length;
        }
        value += '\n';
        totalLength += 1;
      }
      value = value.trimEnd();
      await agentManager.updateMemoryBlock(this.mainAgentId, MEMORY_BLOCK_LABEL, value);
    } catch (err) {
      console.error('AnalystAgent fetch/store error:', err);
    }
  }

  private async fetchCryptopanicData(): Promise<Result[]> {
    console.log('🔍 Fetching Cryptopanic data');
    const now = Date.now();
    if (this.cryptopanicCache && (now - this.cryptopanicCache.timestamp < CACHE_DURATION)) {
      console.log('🔍 Returning cached Cryptopanic data');
      try {
        return JSON.parse(this.cryptopanicCache.data);
      } catch {
        // fallback to refetch
      }
    }
    const url = `https://cryptopanic.com/api/developer/v2/posts/?auth_token=${config.cryptopanic.apiKey}&public=true&filter=important&kind=news&regions=en`;
    const res = await fetch(url);
    if (!res.ok) {
      const error = await res.json();
      console.error('Cryptopanic API error:', error);
      throw new Error(`Cryptopanic API error: ${error.message}`);
    }
    const json: CryptopanicData = await res.json();
    const results = json.results || [];
    this.cryptopanicCache = { data: JSON.stringify(results), timestamp: now };
    return results;
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