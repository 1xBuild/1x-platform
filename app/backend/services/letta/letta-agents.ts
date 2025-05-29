import { lettaClient } from './letta-client';
import { LettaClient } from '@letta-ai/letta-client';
import path from 'path';
import fs from 'fs';
import * as templates from '../../data/template';
import { AgentType, AgentName } from '../../types';
import { parseTemplate } from '../../data/template';
import { config } from '../../config/index';
/**
 * Manages Letta agent mappings for Discord conversations.
 */
class AgentManager {
  private static readonly AGENT_PREFIX = 'agent';
  private readonly lettaClient: LettaClient;
  private readonly MODEL: string;
  private readonly MAX_CONTEXT_WINDOW_LIMIT: number;
  private readonly EMBEDDING: string;
  constructor() {
    this.lettaClient = lettaClient;
    this.MODEL = config.model.modelConfig;
    this.MAX_CONTEXT_WINDOW_LIMIT = 16000;
    this.EMBEDDING = config.model.embeddingConfig;
  }

  /**
   * Generates a unique and meaningful agent name combining user and channel information
   */
  public generateAgentName(userId: string, channelId: string): AgentName {
    return `${AgentManager.AGENT_PREFIX}_${userId}_${channelId}` as AgentName;
  }

  /**
   * Checks if an agent exists by name
   * @param name - The name of the agent to check
   * @returns Promise<AgentType | null> - The agent if found, null otherwise
   */
  private async findAgent(name: string): Promise<AgentType | null> {
    try {
      const agents = await this.lettaClient.agents.list({
        name: name,
        limit: 1
      });
      console.log(`🤖 Found ${agents.length} agents with name: ${name}`);
      return agents[0] || null;
    } catch (error) {
      console.error(`Failed to search for agent: ${name}`, error);
      throw error;
    }
  }

  /**
   * Retrieves an existing main agent or creates a new one if it doesn't exist
   * @returns Promise<string> - The agent ID for the main agent
   */
  async getOrCreateMainAgent(): Promise<string> {
    const agentName = "main-agent";
    let agent = await this.getAgent(agentName);

    if (agent) {
      console.log(`🤖 Main agent already exists: ${agentName}`);
      return agent.id;
    }

    console.log(`🤖 Creating new main agent: ${agentName}`);
    agent = await this.lettaClient.agents.create({
      name: agentName,
      system: templates.systemPrompt,
      description: templates.mainAgentDescription,
      memoryBlocks: [
        {
          label: "human",
          value: templates.mainAgentHumanMemory
        },
        {
          label: "persona",
          value: templates.p33lPersona,
          limit: 6000
        }
      ],
      blockIds: [templates.sharedMemoryBlockId],
      model: this.MODEL,
      contextWindowLimit: this.MAX_CONTEXT_WINDOW_LIMIT,
      embedding: this.EMBEDDING,
    });
    
    return agent.id;
  }

  /**
   * Retrieves an existing agent or creates a new one for a DM conversation.
   * 
   * @param userId - The Discord user's ID
   * @param channelId - The Discord DM channel ID (used as unique key)
   * @returns Promise<string> - The agent ID for this conversation
   */
  public async getOrCreateAgent(userId: string, channelId: string, username: string): Promise<string> {
    const agentName = this.generateAgentName(userId, channelId);
    const agent = await this.getAgent(agentName);

    if (agent) {
      console.log(`🤖 Agent already exists: ${agentName}`);
      return agent.id;
    }

    console.log(`🤖 Creating new agent: ${agentName}`);
    return await this.createAgent(agentName, userId, username);
  }

  /**
   * Retrieves an existing agent by name
   * @param agentName - The name of the agent to retrieve
   * @returns Promise<AgentType> - The agent if found, null otherwise
   */
  public async getAgent(agentName: string): Promise<AgentType | null> {
    return await this.findAgent(agentName);
  }

  /**
   * Gets an existing identity or creates a new one for a user
   * @param userId - Discord user ID to use as identifier key
   * @param username - Discord username to use as identity name
   * @returns Promise<string> - The identity ID
   */
  private async getOrCreateUserIdentity(userId: string, username: string): Promise<string> {
    try {
      // First try to find existing identity
      const existingIdentities = await this.lettaClient.identities.list({
        identifierKey: userId,
        limit: 1
      });

      if (existingIdentities && existingIdentities[0]?.id) {
        console.log(`Found existing identity for user: ${username} (${userId})`);
        return existingIdentities[0].id;
      }

      // Create new identity if none exists
      const identity = await this.lettaClient.identities.create({
        identifierKey: userId,
        name: username,
        identityType: "user"
      });
      
      if (!identity || !identity.id) {
        throw new Error('Failed to create user identity');
      }
      
      console.log(`Identity created for user: ${username} (${userId})`);
      return identity.id;
    } catch (error) {
      console.error('Failed to get or create user identity:', error);
      throw new Error('Failed to get or create user identity');
    }
  }

  /**
   * Creates a new agent on the Letta server with associated user identity
   * 
   * @param agentName - The name of the agent to create
   * @param userId - The Discord user's ID
   * @param username - The Discord username to use as identity name
   * @returns Promise<string> - The agent ID for this conversation
   */
  private async createAgent(agentName: string, userId: string, username: string): Promise<string> {
    try {
      // Get or create user identity
      const identityId = await this.getOrCreateUserIdentity(userId, username);
      if (!identityId) {
        throw new Error('Failed to get or create user identity');
      }

      // Then create the agent with the identity and template + shared memory block
      const lettaAgent = await this.lettaClient.agents.create({
        name: agentName,
        system: templates.systemPrompt,
        description: templates.agentDescription,
        memoryBlocks: [
          {
            label: "human",
            value: parseTemplate(templates.humanMemory, {})
          },
          {
            label: "persona",
            value: templates.p33lPersona,
            limit: 6000
          }
        ],
        blockIds: [templates.sharedMemoryBlockId],
        model: this.MODEL,
        contextWindowLimit: this.MAX_CONTEXT_WINDOW_LIMIT,
        embedding: this.EMBEDDING,
        identityIds: [identityId]  // Associate the new user identity with the agent
      });
      
      console.log(`Agent created: ${agentName} with identity ID: ${identityId}`);
      return lettaAgent.id;
    } catch (error) {
      console.error('Failed to create Letta agent:', error);
      throw new Error('Failed to initialize Letta agent');
    }
  }

  /**
   * Retrieve an agent by its name
   * @param name - The name of the agent to retrieve
   * @returns Promise<string> - The agent ID if found
   */
  public async getAgentByName(name: string): Promise<AgentType> {
    try {
      const agents = await this.lettaClient.agents.list({
        name: name,
        limit: 1  // We only need the first match
      });
      
      const agent = agents[0];
      if (!agent) {
        throw new Error(`No agent found with name: ${name}`);
      }
      
      return agent;
    } catch (error) {
      console.error(`Failed to retrieve agent with name: ${name}`, error);
      throw new Error('Failed to retrieve agent');
    }
  }

  public async deleteAgent(agentId: string) {
    try {
      await this.lettaClient.agents.delete(agentId);
      console.log(`Agent deleted: ${agentId}`);
    } catch (error) {
      console.error(`Failed to delete agent: ${agentId}`, error);
      throw new Error('Failed to delete agent');
    }
  }

  /**
   * Export an agent to a JSON file
   * @param agentId - The ID of the agent to export
   * @returns Promise<any> - The exported agent data
  */
  // FIXME: not working at the moment (April 5, 2025), same in the ADE
  public async exportAgent(agentId: string) {
    try {
      console.log(`Exporting agent ${agentId} with url: ${config.letta.baseUrl}/v1/agents/${agentId}/export`);
      
      // Export the agent using the Letta API
      const response = await fetch(
        `${config.letta.baseUrl}/v1/agents/${agentId}/export`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.letta.token}`
          }
        }
      );

      if (!response.ok) {
        const errorResponse = await response.text();  // Get raw text first
        console.error('Export agent response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorResponse
        });
        
        try {
          // Try to parse as JSON if possible
          const errorJson = JSON.parse(errorResponse);
          throw new Error(`Failed to export agent: ${errorJson.detail || JSON.stringify(errorJson)}`);
        } catch (e) {
          // If JSON parsing fails, use the raw text
          throw new Error(`Failed to export agent: ${errorResponse || response.statusText}`);
        }
      }

      const afFile = await response.json();
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const afPath = path.join(dataDir, 'main-agent.af');
      fs.writeFileSync(afPath, JSON.stringify(afFile, null, 2));
      
      console.log(`Agent file written to ${afPath}`);
      
      return afFile;
    } catch (error) {
      console.error(`Failed to export agent: ${agentId}`, error);
      throw new Error('Failed to export agent');
    }
  }

  /**
   * Checks if an agent exists by ID
   * @param agentId - The ID of the agent to check
   * @returns Promise<boolean> - True if the agent exists, false otherwise
   */
  private async agentExists(agentId: string): Promise<boolean> {
    try {
      const agents = await this.lettaClient.agents.list({
        limit: 100  // Get a reasonable number of agents to check
      });
      
      // Check if any agent has the matching ID
      return agents.some(agent => agent.id === agentId);
    } catch (error) {
      console.error(`Failed to check if agent exists: ${agentId}`, error);
      throw error;
    }
  }

  /**
   * Updates a specific memory block for an agent
   * @param agentId - The ID of the agent to update
   * @param label - The label of the memory block to update
   * @param value - The new value for the memory block
   * @returns Promise<void>
   */
  public async updateMemoryBlock(agentId: string, label: string, value: string): Promise<void> {
    try {
      // First verify the agent exists
      const exists = await this.agentExists(agentId);
      if (!exists) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      let response;
      try {
        response = await this.lettaClient.agents.blocks.modify(agentId, label, {
          value: value
        });
      } catch (error) {
        console.error(`Failed to update memory block '${label}' for agent: ${agentId}`, error);
        throw new Error(`Failed to update memory block: ${error}`);
      }
      
      console.log(response);
      console.log(`Memory block '${label}' updated for agent: ${agentId}`);
    } catch (error) {
      console.error(`Failed to update memory block '${label}' for agent: ${agentId}`, error);
      throw new Error(`Failed to update memory block: ${error}`);
    }
  }

  /**
   * Gets a specific memory block for an agent
   * @param agentId - The ID of the agent
   * @param label - The label of the memory block to get
   * @returns Promise<string | null> - The value of the memory block, or null if not found
   */
  public async getMemoryBlock(agentId: string, label: string): Promise<string | null> {
    try {
      // First verify the agent exists
      const exists = await this.agentExists(agentId);
      if (!exists) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      try {
        const block = await this.lettaClient.agents.blocks.retrieve(agentId, label);
        return block.value;
      } catch (error) {
        console.log(`Memory block '${label}' not found for agent: ${agentId}`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to get memory block '${label}' for agent: ${agentId}`, error);
      throw new Error(`Failed to get memory block: ${error}`);
    }
  }
}

export const agentManager = new AgentManager();