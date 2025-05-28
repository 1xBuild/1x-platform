import { agentManager } from '../adapters/letta-agents';
import { dataSourceManager } from '../adapters/letta-datasource';
import { config } from '../config/index';

/**
 * Gets or creates the main agent for the bot
 * @returns Promise<string> - The agent ID for the main agent
 */
export const getOrCreateMainAgent = async (): Promise<string> => {
  const mainAgentId = await agentManager.getOrCreateMainAgent();
  
  // Attach data source to agent
  if (config.dataSource.mainDataSourceName && config.dataSource.mainDataSourceFilePath) {
    const mainDataSourceId = await dataSourceManager.getOrCreateMainDataSource(
      config.dataSource.mainDataSourceName, 
      config.dataSource.mainDataSourceFilePath
    );
    console.log(`🤖 Main data source initialized: ${mainDataSourceId}`);
    await dataSourceManager.attachSourceToAgent(mainAgentId, mainDataSourceId);
  }
  
  console.log(`🤖 Main agent initialized: ${mainAgentId}`);
  return mainAgentId;
};

/**
 * Gets or creates a coaching agent for a specific user
 * @param userId - The Discord user's ID
 * @param channelId - The Discord channel ID
 * @param username - The Discord username
 * @returns Promise<string> - The agent ID for this user's coaching
 */
export const getOrCreatePersonalAgent = async (
  userId: string,
  channelId: string,
  username: string
): Promise<string> => {
  // Get or create the agent
  const agentId = await agentManager.getOrCreateAgent(userId, channelId, username);
  
  // Attach data source to the agent if it's a new agent
  if (config.dataSource.mainDataSourceName && config.dataSource.mainDataSourceFilePath) {
    const mainDataSourceId = await dataSourceManager.getOrCreateMainDataSource(
      config.dataSource.mainDataSourceName,
      config.dataSource.mainDataSourceFilePath
    );
    await dataSourceManager.attachSourceToAgent(agentId, mainDataSourceId);
  }
  
  console.log(`🤖 Coaching agent ready: ${agentId} for user: ${username}`);
  return agentId;
};
