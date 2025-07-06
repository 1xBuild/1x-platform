import { getUserSecret } from '../database/db';
import lighthouse from '@lighthouse-web3/sdk';
import { webcrypto } from 'crypto';

// Polyfill for crypto global object in Railway environment
if (typeof global !== 'undefined' && !global.crypto) {
  try {
    global.crypto = webcrypto as any;
  } catch (error) {
    // Fallback if webcrypto is not available
    const crypto = require('crypto');
    global.crypto = crypto;
  }
}

function getLighthouseKeys(agentId: string) {
  const apiKey = getUserSecret(agentId, 'LIGHTHOUSE_API_KEY');
  const publicKey = getUserSecret(agentId, 'LIGHTHOUSE_PUBLIC_KEY');
  const jwt = getUserSecret(agentId, 'LIGHTHOUSE_JWT');
  if (!apiKey || !publicKey || !jwt) {
    throw new Error('Missing Lighthouse credentials in user secrets');
  }
  return {
    apiKey: String(apiKey),
    publicKey: String(publicKey),
    jwt: String(jwt),
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
    const { apiKey, publicKey, jwt } = getLighthouseKeys(agentId);
    if (!fileBuffer || !filename)
      throw new Error('File buffer and filename are required');
    const safeFilename = String(filename);
    const safeBuffer = new Uint8Array(fileBuffer);
    // 3. Upload
    const file = new File([safeBuffer], safeFilename);
    const response = await lighthouse.uploadEncrypted(
      file,
      apiKey,
      publicKey,
      jwt,
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
  async uploadEncryptedJSON(
    json: string,
    filename: string,
    agentId: string,
    publicKey: string,
    signedMessage: string,
  ) {
    console.log('uploadEncryptedJSON : ', json, filename, agentId);
    const { apiKey } = getLighthouseKeys(agentId);
    console.log('apiKey : ', apiKey);
    console.log('publicKey : ', publicKey);
    console.log('signedMessage : ', signedMessage);
    if (!json || !filename) throw new Error('JSON and filename are required');
    const safeFilename = String(filename);
    console.log('safeFilename : ', safeFilename);
    // 3. Upload
    try {
      const response = await lighthouse.textUploadEncrypted(
        json,
        apiKey,
        publicKey,
        signedMessage,
        safeFilename,
      );
      console.log('response : ', response);
      // Handle possible array response
      const fileData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      console.log('fileData : ', fileData);
      if (!fileData || !fileData.Hash)
        throw new Error('Lighthouse upload failed: missing CID');
      return {
        cid: String(fileData.Hash),
        url: `https://gateway.lighthouse.storage/ipfs/${fileData.Hash}`,
      };
    } catch (error) {
      console.log('error : ', error);
    }
  },

  /**
   * Download and decrypt a file from Lighthouse
   * @param {string} cid - The file CID
   * @param {string} agentId - The agent requesting
   * @returns {Promise<Buffer>} - The decrypted file data
   */
  async downloadDecryptedFile(cid: string, agentId: string) {
    const { apiKey, publicKey, jwt } = getLighthouseKeys(agentId);
    if (!cid) throw new Error('CID is required');
    const safeCid = String(cid);
    // 3. Fetch encryption key
    const response = await lighthouse.fetchEncryptionKey(
      safeCid,
      publicKey,
      jwt,
    );
    const { key } = response.data;
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
