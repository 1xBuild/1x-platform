import { agentManager } from './letta/letta-agents';
import { toolsManager } from './letta/letta-tools';
import { TelegramBot } from './telegram-bot';

export class CryptoPanicToolManager {
  private bots: Map<string, TelegramBot> = new Map();

  public async start(agentId: string) {
    console.log(`[CryptoPanicToolManager] Attaching CryptoPanicTool to agentId: ${agentId}`);
    const tools = await toolsManager.listTools();
    const cryptoPanicTool = tools.find((tool) => tool.name === 'CryptoPanicTool');
    if (!cryptoPanicTool || !cryptoPanicTool.id) {
      console.log(`[CryptoPanicToolManager] CryptoPanicTool not found`);
      throw new Error('CryptoPanicTool not found');
    }
    await agentManager.attachTool(agentId, cryptoPanicTool.id);
  }
  
  public async stop(agentId: string) {
    console.log(`[CryptoPanicToolManager] Detaching CryptoPanicTool from agentId: ${agentId}`);
    const tools = await toolsManager.listTools();
    const cryptoPanicTool = tools.find((tool) => tool.name === 'CryptoPanicTool');
    if (!cryptoPanicTool || !cryptoPanicTool.id) {
      console.log(`[CryptoPanicToolManager] CryptoPanicTool or agent not found`);
      throw new Error('CryptoPanicTool or agent not found');
    }
    await agentManager.detachTool(agentId, cryptoPanicTool.id);
    console.log(`[CryptoPanicToolManager] CryptoPanicTool detached from agentId: ${agentId}`);
  }

  public async isRunning(agentId: string) {
    const agent = await agentManager.getAgentById(agentId);
    if (!agent) {
      console.log(`[CryptoPanicToolManager] Agent not found`);
      throw new Error('Agent not found');
    }
    return agent.tools.some((tool) => tool.name === 'CryptoPanicTool');
  }
}

export const cryptoPanicToolManager = new CryptoPanicToolManager();
