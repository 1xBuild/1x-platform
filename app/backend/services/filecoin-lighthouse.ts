import { getUserSecret } from '../database/db';
import lighthouse from '@lighthouse-web3/sdk';
import { ethers } from 'ethers';

function getLighthouseKeys(agentId: string) {
  const apiKey = getUserSecret(agentId, 'LIGHTHOUSE_API_KEY');
  const publicKey = getUserSecret(agentId, 'LIGHTHOUSE_PUBLIC_KEY');
  const privateKey = getUserSecret(agentId, 'LIGHTHOUSE_PRIVATE_KEY');
  const jwt = getUserSecret(agentId, 'LIGHTHOUSE_JWT');
  if (!apiKey || !publicKey) {
    throw new Error('Missing Lighthouse credentials in user secrets');
  }
  return {
    apiKey: String(apiKey),
    publicKey: String(publicKey),
    privateKey: privateKey ? String(privateKey) : undefined,
    jwt: jwt ? String(jwt) : undefined,
  };
}

export const filecoinLighthouseService = {
  /**
   * Upload and encrypt a file to Lighthouse
   * @param {Buffer} fileBuffer - The file data
   * @param {string} filename - The file name
   * @param {string} agentId - The agent uploading
   * @returns {Promise<{cid: string, url: string}>}
   */
  async uploadEncryptedFile(
    fileBuffer: Buffer,
    filename: string,
    agentId: string,
  ) {
    const { apiKey, publicKey, privateKey, jwt } = getLighthouseKeys(agentId);
    if (!fileBuffer || !filename)
      throw new Error('File buffer and filename are required');
    const safeFilename = String(filename);
    const safeBuffer = new Uint8Array(fileBuffer);
    let signedMessage: string | undefined = undefined;
    if (!jwt) {
      if (!privateKey) throw new Error('Missing private key for signing');
      // 1. Get auth message
      const {
        data: { message },
      } = await lighthouse.getAuthMessage(publicKey);
      if (!message) throw new Error('Lighthouse auth message is missing');
      // 2. Sign
      const signer = new ethers.Wallet(privateKey);
      signedMessage = await signer.signMessage(message);
    }
    // 3. Upload
    const file = new File([safeBuffer], safeFilename);
    const response = await lighthouse.uploadEncrypted(
      file,
      apiKey,
      publicKey,
      jwt || signedMessage!,
    );
    // Handle possible array response
    const fileData = Array.isArray(response.data)
      ? response.data[0]
      : response.data;
    if (!fileData || !fileData.Hash)
      throw new Error('Lighthouse upload failed: missing CID');
    return {
      cid: String(fileData.Hash),
      url: `https://gateway.lighthouse.storage/ipfs/${fileData.Hash}`,
    };
  },

  /**
   * Upload and encrypt a file to Lighthouse
   * @param {Buffer} fileBuffer - The file data
   * @param {string} filename - The file name
   * @param {string} agentId - The agent uploading
   * @returns {Promise<{cid: string, url: string}>}
   */
  async uploadEncryptedJSON(json: string, filename: string, agentId: string) {
    const { apiKey, publicKey, privateKey } = getLighthouseKeys(agentId);
    if (!json || !filename) throw new Error('JSON and filename are required');
    const safeFilename = String(filename);
    // 1. Get auth message
    const {
      data: { message },
    } = await lighthouse.getAuthMessage(publicKey);
    if (!message) throw new Error('Lighthouse auth message is missing');
    if (!privateKey) throw new Error('Missing private key for signing');
    // 2. Sign
    const signer = new ethers.Wallet(privateKey);
    const signedMessage = await signer.signMessage(message);
    // 3. Upload
    const response = await lighthouse.textUploadEncrypted(
      json,
      apiKey,
      publicKey,
      signedMessage,
      safeFilename,
    );
    // Handle possible array response
    const fileData = Array.isArray(response.data)
      ? response.data[0]
      : response.data;
    if (!fileData || !fileData.Hash)
      throw new Error('Lighthouse upload failed: missing CID');
    return {
      cid: String(fileData.Hash),
      url: `https://gateway.lighthouse.storage/ipfs/${fileData.Hash}`,
    };
  },

  /**
   * Download and decrypt a file from Lighthouse
   * @param {string} cid - The file CID
   * @param {string} agentId - The agent requesting
   * @returns {Promise<Buffer>} - The decrypted file data
   */
  async downloadDecryptedFile(cid: string, agentId: string) {
    const { apiKey, publicKey, privateKey, jwt } = getLighthouseKeys(agentId);
    if (!cid) throw new Error('CID is required');
    const safeCid = String(cid);
    let signedMessage: string | undefined = undefined;
    if (!jwt) {
      if (!privateKey) throw new Error('Missing private key for signing');
      // 1. Get auth message
      const {
        data: { message },
      } = await lighthouse.getAuthMessage(publicKey);
      if (!message) throw new Error('Lighthouse auth message is missing');
      // 2. Sign
      const signer = new ethers.Wallet(privateKey);
      signedMessage = await signer.signMessage(message);
    }
    // 3. Fetch encryption key
    const {
      data: { key },
    } = await lighthouse.fetchEncryptionKey(
      safeCid,
      publicKey,
      jwt || signedMessage!,
    );
    if (!key) throw new Error('Lighthouse decryption failed: missing key');
    // 4. Download and decrypt
    const file = await lighthouse.decryptFile(safeCid, String(key));
    if (Buffer.isBuffer(file)) {
      return file;
    }
    if (file instanceof ArrayBuffer) {
      return Buffer.from(file);
    }
    if (typeof file === 'string') {
      return Buffer.from(file, 'utf-8');
    }
    if (typeof file === 'object') {
      return Buffer.from(JSON.stringify(file), 'utf-8');
    }
    throw new Error('Unsupported file type');
  },
};
