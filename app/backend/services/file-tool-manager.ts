import { agentManager } from './letta/letta-agents';
import { toolsManager } from './letta/letta-tools';

export class OpenFileToolManager {
  public async start(agentId: string) {
    console.log(
      `[OpenFileToolManager] Attaching OpenFile tool to agentId: ${agentId}`,
    );
    const tools = await toolsManager.listTools();
    const openFileTool = tools.find((tool) => tool.name === 'open_file');
    if (!openFileTool || !openFileTool.id) {
      console.log(`[OpenFileToolManager] OpenFile tool not found`);
      throw new Error('OpenFile tool not found');
    }
    await agentManager.attachTool(agentId, openFileTool.id);
  }

  public async stop(agentId: string) {
    console.log(
      `[OpenFileToolManager] Detaching OpenFile tool from agentId: ${agentId}`,
    );
    const tools = await toolsManager.listTools();
    const openFileTool = tools.find((tool) => tool.name === 'open_file');
    if (!openFileTool || !openFileTool.id) {
      console.log(`[OpenFileToolManager] OpenFile tool or agent not found`);
      throw new Error('OpenFile tool or agent not found');
    }
    await agentManager.detachTool(agentId, openFileTool.id);
    console.log(
      `[OpenFileToolManager] OpenFile tool detached from agentId: ${agentId}`,
    );
  }

  public async isRunning(agentId: string) {
    console.log(
      `[OpenFileToolManager] Checking if OpenFile tool is running for agentId: ${agentId}`,
    );
    const agent = await agentManager.getAgentById(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }
    return agent.tools.some((tool) => tool.name === 'open_file');
  }
}

export const openFileToolManager = new OpenFileToolManager();
