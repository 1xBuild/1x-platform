import { EmbeddingConfig } from "@letta-ai/letta-client/api/types/EmbeddingConfig";
import { lettaClient } from "./letta-client";
import { LettaClient } from "@letta-ai/letta-client";
import { createReadStream } from "fs";
import { isFileUploaded, markFileAsUploaded } from "../database/db";
import { config } from "../config";

const EMBEDDING_CONFIG = config.model.embeddingConfig;

class DataSourceManager {
  protected lettaClient: LettaClient;
  protected embeddingConfig!: EmbeddingConfig;

  constructor() {
    this.lettaClient = lettaClient;
    this.initialize();
  }

  public async initialize() {
    const embeddingConfig = EMBEDDING_CONFIG;
    if (!embeddingConfig) {
      throw new Error("DEFAULT_EMBEDDING is not set");
    }
    const embeddingConfigs = await this.lettaClient.embeddingModels.list();
    this.embeddingConfig = embeddingConfigs.find(config => config.handle === embeddingConfig) as EmbeddingConfig;
    if (!this.embeddingConfig) {
      throw new Error(`Embedding config ${embeddingConfig} not found`);
    }
  }

  /**
   * Get or create a main data source
   * @param MAIN_DATA_SOURCE_NAME - The name of the main data source
   * @param MAIN_DATA_SOURCE_FILE_PATH - The path to the file to add to the main data source
   * @returns The ID of the main data source
   */
  public async getOrCreateMainDataSource(mainDataSourceName: string, mainDataSourceFilePath?: string): Promise<string> {
    const mainDataSourceId = await this.getOrCreateDataSource(mainDataSourceName);
    try {
      if (mainDataSourceFilePath) {
        await this.addFileToSource(mainDataSourceId, mainDataSourceFilePath);
      }
    } catch (error) {
      console.error("Error adding file to main data source: ", error);
      throw error;
    }
    return mainDataSourceId;
  }

  /**
   * Get or create a data source
   * @param name - The name of the data source
   * @returns The ID of the data source
   */
  public async getOrCreateDataSource(name: string): Promise<string> {
    try {
      const allDataSources = await this.lettaClient.sources.list();
      const dataSource = allDataSources.find(source => source.name === name);
      if (dataSource && dataSource.id) {
        return dataSource.id;
      }


      const dataSourceId = await this.createSource(name);
      return dataSourceId;
    } catch (error) {
      console.error("Error getting or creating data source: ", error);
      throw error;
    }
  }

  /**
   * Create a new source that can be used to add data to agents
   * @param name - The name of the source
   * @returns The ID of the created source
   */
  public async createSource(name: string): Promise<string> {
    try {
      const source = await this.lettaClient.sources.create({
        name: name,
        embeddingConfig: this.embeddingConfig
      });
      if (!source.id) {
        throw new Error("Failed to create source");
      }
      return source.id;
    } catch (error) {
      console.error("Error creating source: ", error);
      throw error;
    }
  }

  /**
   * Add data to a source
   * @param sourceId - The ID of the source
   * @param fileUrl - The URL of the file to add
   * ps: doesn't return anything because it's the source that should be added to the agent, not the file
   */
  public async addFileToSource(sourceId: string, fileUrl: string): Promise<void> {
    try {
      // Check if file has already been uploaded to this source
      if (isFileUploaded(sourceId, fileUrl)) {
        console.log(`File ${fileUrl} already uploaded to source ${sourceId}, skipping upload`);
        return;
      }

      
      console.log("uploading file to source : ", sourceId, fileUrl);
      // upload a file into the source
      const uploadJob = await this.lettaClient.sources.files.upload(
        createReadStream(fileUrl),
        sourceId,
      );
      if (!uploadJob.id) {
        throw new Error("Failed to upload file");
      }
      console.log("file upload job created")

      // wait until the job is completed
      while (true) {
        const job = await this.lettaClient.jobs.retrieve(uploadJob.id);
        if (job.status === "completed") {
          // Mark this file as uploaded to this source in the database
          markFileAsUploaded(sourceId, fileUrl);
          break;
        } else if (job.status === "failed") {
          throw new Error(`Job failed: ${job.metadata}`);
        }
        console.log(`Job status: ${job.status}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      console.log("file uploaded")
    } catch (error) {
      console.error("Error adding file to source: ", error);
      throw error;
    }
  }

  /**
   * Attach a source to an agent
   * @param agentId - The ID of the agent
   * @param sourceId - The ID of the source
   */
  public async attachSourceToAgent(agentId: string, sourceId: string): Promise<void> {
    try {
      await this.lettaClient.agents.sources.attach(agentId, sourceId);
    } catch (error) {
      console.error("Error attaching source to agent: ", error);
      throw error;
    }
  }
}

export const dataSourceManager = new DataSourceManager();
export { DataSourceManager };
