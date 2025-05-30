import { config } from '../config';
import { agentManager } from './letta/letta-agents';

const MEMORY_BLOCK_LABEL = config.analystAgent.cryptoNewsMemoryBlockLabel;
const MAX_MEMORY_LENGTH = 6000;
const DELAY_BETWEEN_FETCHES = 8 * 60 * 60 * 1000; // 8 hours
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms

class AnalystAgentService {
  private enabled: boolean = config.analystAgent.enabled;
  private timer: NodeJS.Timeout | null = null;
  private mainAgentId: string | null = null;

  // Cryptopanic cache
  private cryptopanicCache: { data: string; timestamp: number } | null = null;

  public isEnabled() {
    console.log('🔍 Analyst Agent status:', this.enabled);
    return this.enabled;
  }

  public enable() {
    this.start();
    this.enabled = true;
    console.log('🔍 Analyst Agent enabled');
  }

  public disable() {
    this.clearMemoryBlock();
    this.stop();
    this.enabled = false;
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
    if (!this.enabled || !this.mainAgentId) return;
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

  public start() {
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
}

export const analystAgent = new AnalystAgentService(); 