import {
  createStorageEntry,
  getStorageEntry,
  updateStorageEntry,
  deleteStorageEntry,
  listStorageEntries,
  StorageRecord,
} from '../database/db';
import { filecoinLighthouseService } from './filecoin-lighthouse';

export const storageService = {
  async uploadFile(agentId: string, content: string, filename: string) {
    // Upload and encrypt file to Lighthouse
    const { cid, url } = await filecoinLighthouseService.uploadEncryptedFile(
      Buffer.from(content),
      filename,
      agentId,
    );
    // Save entry in DB
    const id = createStorageEntry({
      agent_id: agentId,
      filename,
      cid,
      url,
      encryption: 'lighthouse',
    });
    return getStorageEntry(id);
  },

  async uploadJSON(agentId: string, content: string, filename: string) {
    const { cid, url } = await filecoinLighthouseService.uploadEncryptedJSON(
      content,
      filename,
      agentId,
    );
    const id = createStorageEntry({
      agent_id: agentId,
      filename,
      cid,
      url,
      encryption: 'lighthouse',
    });
    return getStorageEntry(id);
  },

  async download(id: string, agentId: string) {
    const entry = getStorageEntry(id);
    if (!entry) throw new Error('File not found');
    if (entry.agent_id !== agentId) throw new Error('Unauthorized');
    return await filecoinLighthouseService.downloadDecryptedFile(
      entry.cid,
      agentId,
    );
  },

  listFiles(agentId?: string): StorageRecord[] {
    return listStorageEntries(agentId);
  },

  deleteFile(id: string, agentId: string) {
    const entry = getStorageEntry(id);
    if (!entry) throw new Error('File not found');
    if (entry.agent_id !== agentId) throw new Error('Unauthorized');
    deleteStorageEntry(id);
  },
};
