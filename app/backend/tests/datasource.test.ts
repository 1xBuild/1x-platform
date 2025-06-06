// __tests__/datasource.test.ts
import { DataSourceManager } from '../services/letta/letta-datasource';
import { createReadStream } from 'fs';
// No need to import jest types directly

// Mock for the EMBEDDING_CONFIG value
jest.mock('../adapters/letta-datasource', () => ({
  EMBEDDING_CONFIG: 'embed1',
  MODEL_CONFIG: 'model1',
}));

jest.mock('fs', () => ({
  createReadStream: jest.fn(() => 'mockStream'),
}));

// Mock implementation of the entire module
jest.mock('../adapters/letta-datasource', () => {
  // Define mock client inline in the factory function
  const mockLettaClient = {
    models: {
      listEmbeddingModels: jest.fn().mockResolvedValue([{ id: 'embed1' }]),
    },
    sources: {
      list: jest.fn(),
      create: jest.fn(),
      files: { upload: jest.fn() },
    },
    jobs: { retrieve: jest.fn() },
    agents: { sources: { attach: jest.fn() } },
  };

  // Return the mock exports
  return {
    lettaClient: mockLettaClient,
  };
});

// Create a reference to the mock for our tests
const mockLettaClient = jest.requireMock(
  '../adapters/letta-datasource',
).lettaClient;

describe('DataSourceManager', () => {
  let manager: DataSourceManager;

  beforeEach(async () => {
    // Reset the implementation if needed for specific tests
    (mockLettaClient.models.listEmbeddingModels as jest.Mock).mockResolvedValue(
      [{ id: 'embed1' }],
    );
    // Create a new instance instead of using the real one
    manager = new DataSourceManager();
    await manager.initialize();
  });

  describe('createSource', () => {
    it('should create a new source and return its id', async () => {
      (mockLettaClient.sources.create as jest.Mock).mockResolvedValue({
        id: 'source123',
      });
      const id = await manager.createSource('TestSource');
      expect(id).toBe('source123');
      expect(mockLettaClient.sources.create).toHaveBeenCalledWith({
        name: 'TestSource',
        embeddingConfig: { id: 'embed1' },
      });
    });

    it('should throw if source creation fails', async () => {
      (mockLettaClient.sources.create as jest.Mock).mockResolvedValue({});
      await expect(manager.createSource('TestSource')).rejects.toThrow(
        'Failed to create source',
      );
    });
  });

  describe('getOrCreateDataSource', () => {
    it('should return existing data source id if found', async () => {
      (mockLettaClient.sources.list as jest.Mock).mockResolvedValue([
        { name: 'Existing', id: 'id1' },
      ]);
      const id = await manager.getOrCreateDataSource('Existing');
      expect(id).toBe('id1');
    });

    it('should create and return new data source id if not found', async () => {
      (mockLettaClient.sources.list as jest.Mock).mockResolvedValue([]);
      (mockLettaClient.sources.create as jest.Mock).mockResolvedValue({
        id: 'newid',
      });
      const id = await manager.getOrCreateDataSource('NewSource');
      expect(id).toBe('newid');
    });
  });

  describe('getOrCreateMainDataSource', () => {
    it('should get or create main data source and add file', async () => {
      // Mock getOrCreateDataSource and addFileToSource
      const spyGetOrCreate = jest
        .spyOn(manager, 'getOrCreateDataSource')
        .mockResolvedValue('mainid');
      const spyAddFile = jest
        .spyOn(manager, 'addFileToSource')
        .mockResolvedValue();
      const id = await manager.getOrCreateMainDataSource(
        'Main',
        '/path/to/file.txt',
      );
      expect(id).toBe('mainid');
      expect(spyGetOrCreate).toHaveBeenCalledWith('Main');
      expect(spyAddFile).toHaveBeenCalledWith('mainid', '/path/to/file.txt');
    });
  });
});
