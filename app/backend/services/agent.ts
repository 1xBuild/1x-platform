import * as db from '../database/db';
import { agentManager } from './letta/letta-agents';
import type { IAgent } from '../types';
import { parseTemplate } from '../data/prompt';
import * as templates from '../data/prompt';
import { config } from '../config/index';
import { dataSourceManager } from './letta/letta-datasource';

export const agentService = {
  // List all local agents, optionally enriched with Letta data
  list: async (withLetta: boolean = false) => {
    const agents = db.listAgents();
    if (!withLetta) return agents;
    // Enrich each agent with Letta data if requested
    const enriched = await Promise.all(
      agents.map(async (agent) => {
        try {
          const letta = await agentManager.getAgentByName(agent.details.name);
          return { ...agent, letta };
        } catch {
          return { ...agent, letta: null };
        }
      })
    );
    return enriched;
  },

  // Get a single agent, optionally with Letta data
  get: async (id: string, withLetta: boolean = false) => {
    const agent = db.getAgentById(id);
    if (!agent) return null;
    if (!withLetta) return agent;
    try {
      const letta = await agentManager.getAgentByName(agent.details.name);
      return { ...agent, letta };
    } catch {
      return { ...agent, letta: null };
    }
  },

  // Create agent locally and in Letta
  create: async (agent: IAgent): Promise<string> => {
    try {
      if (!agent.id) throw new Error('Agent ID is required');
      // Try to get or create in Letta first
      let lettaId: string;
      try {
        const letta = await agentManager.getAgentById(agent.id);
        lettaId = letta?.id || (await agentService.getOrCreateLettaAgent(agent));
      } catch (lettaError) {
        console.error(`Failed to get or create Letta agent for ID ${agent.id}:`, lettaError);
        throw lettaError;
      }
      // Only update local DB if Letta succeeded
      await db.createAgent({ ...agent, id: lettaId });
      return lettaId;
    } catch (error) {
      console.error(`Error in agentService.create for agent ID ${agent.id}:`, error);
      throw error;
    }
  },

  // Update agent locally and in Letta
  update: async (agent: IAgent): Promise<string> => {
    try {
      if (!agent.id) throw new Error('Agent ID is required');
      // Update Letta first
      let lettaId: string;
      try {
        const letta = await agentManager.getAgentById(agent.id);
        if (letta) {
          await agentManager.updateMemoryBlock(letta.id, 'persona', agent.details.persona);
          lettaId = letta.id;
        } else {
          lettaId = await agentService.getOrCreateLettaAgent(agent);
        }
      } catch (lettaError) {
        console.error(`Failed to update or create Letta agent for ID ${agent.id}:`, lettaError);
        throw lettaError;
      }
      // Only update local DB if Letta succeeded
      await db.updateAgent({ ...agent, id: lettaId });
      return lettaId;
    } catch (error) {
      console.error(`Error in agentService.update for agent ID ${agent.id}:`, error);
      throw error;
    }
  },

  // Delete agent locally and in Letta
  delete: async (id: string, agentName?: string): Promise<string> => {
    if (agentName) {
      try {
        const letta = await agentManager.getAgentByName(agentName);
        if (letta) {
          await agentManager.deleteAgent(letta.id);
        }
      } catch (error) {
        console.error(`Failed to delete Letta agent for name ${agentName}:`, error);
        throw error;
      }
    }
    try {
      await db.deleteAgent(id);
      return id;
    } catch (error) {
      console.error(`Error deleting local agent with ID ${id}:`, error);
      throw error;
    }
  },

  // Sync all local agents with Letta (one-way: local -> Letta)
  syncToLetta: async () => {
    const agents = db.listAgents();
    for (const agent of agents) {
      try {
        await agentManager.getAgentByName(agent.details.name);
      } catch {
        await agentService.getOrCreateLettaAgent(agent);
      }
    }
  },

  // Helper to create or get a Letta agent from our IAgent type, with extra Letta options
  getOrCreateLettaAgent: async (
    agent: IAgent,
    lettaOptions: Partial<{
      userId: string;
      username: string;
      blockIds: string[];
      contextWindowLimit: number;
      embedding: any;
      memoryBlocks: any[];
    }> = {}
  ): Promise<string> => {
    return agentManager.getOrCreateAgent({
      agentName: agent.details.name,
      description: agent.details.description,
      systemPrompt: agent.details.systemPrompt,
      model: agent.details.model,
      memoryBlocks: [
        { label: 'human', value: parseTemplate(templates.humanMemory, {}) },
        { label: 'persona', value: agent.details.persona, limit: 6000 },
      ],
      ...lettaOptions,
    });
  },

  // Helper to generate agent config for main or DM agent
  buildAgentConfig: ({
    name,
    description,
    systemPrompt,
    persona,
    model,
    version = 1,
    id = '',
  }: {
    name: string;
    description: string;
    systemPrompt: string;
    persona: string;
    model: any;
    version?: number;
    id?: string;
  }): IAgent => {
    return {
      id,
      version,
      details: {
        name,
        description,
        systemPrompt,
        persona,
        model,
      },
    };
  },

  // Get or create the main agent (local + Letta)
  // The main agent is the one connected to the public Discord / Telegram server
  getOrCreateMainAgent: async () => {
    const agentName = (config.env === 'development') ? 'main-agent-dev' : 'main-agent';
    let agent = db.listAgents().find(a => a.details.name === agentName);
    if (agent && agent.id) return agent.id;

    // Create agent config
    const newAgent: IAgent = agentService.buildAgentConfig({
      name: agentName,
      description: templates.mainAgentDescription,
      systemPrompt: templates.systemPrompt,
      persona: templates.p33lPersona,
      model: config.model.modelConfig,
    });

    // Create or get in Letta using the DRY helper
    const lettaId = await agentService.getOrCreateLettaAgent(newAgent, {
      blockIds: [templates.sharedMemoryBlockId],
      contextWindowLimit: 16000,
      embedding: config.model.embeddingConfig,
      memoryBlocks: [
        { label: 'human', value: templates.mainAgentHumanMemory },
        { label: 'persona', value: templates.p33lPersona, limit: 6000 },
      ],
    });

    // Create local agent
    await db.createAgent({ ...newAgent, id: lettaId });

    // Attach data source to agent in Letta
    if (config.dataSource.mainDataSourceName && config.dataSource.mainDataSourceFilePath) {
      const mainDataSourceId = await dataSourceManager.getOrCreateMainDataSource(
        config.dataSource.mainDataSourceName,
        config.dataSource.mainDataSourceFilePath
      );
      await dataSourceManager.attachSourceToAgent(lettaId, mainDataSourceId);
    }
    return lettaId;
  },

  // Get or create a DM agent (local + Letta)
  getOrCreateDmAgent: async (userId: string, channelId: string, username: string): Promise<string> => {
    const agentName = agentManager.generateAgentName(userId, channelId);
    let agent = db.listAgents().find(a => a.details.name === agentName);
    if (agent && agent.id) return agent.id;

    // Create agent config
    const newAgent: IAgent = agentService.buildAgentConfig({
      name: agentName,
      description: templates.agentDescription,
      systemPrompt: templates.systemPrompt,
      persona: templates.p33lPersona,
      model: config.model.modelConfig,
    });

    // Create or get in Letta using the DRY helper
    const lettaId = await agentService.getOrCreateLettaAgent(newAgent, {
      userId,
      username,
      blockIds: [templates.sharedMemoryBlockId],
      contextWindowLimit: 16000,
      embedding: config.model.embeddingConfig,
    });

    // Create local agent
    await db.createAgent({ ...newAgent, id: lettaId });

    // Attach data source to agent in Letta if needed
    if (config.dataSource.mainDataSourceName && config.dataSource.mainDataSourceFilePath) {
      const mainDataSourceId = await dataSourceManager.getOrCreateMainDataSource(
        config.dataSource.mainDataSourceName,
        config.dataSource.mainDataSourceFilePath
      );
      await dataSourceManager.attachSourceToAgent(lettaId, mainDataSourceId);
    }
    return lettaId;
  },

};