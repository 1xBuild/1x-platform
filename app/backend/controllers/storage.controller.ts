import { Request, Response } from 'express';
import { storageService } from '../services/storage';
import { getUserSecret, setUserSecret } from '../database/db';
import axios from 'axios';

export async function list(req: Request, res: Response) {
  const agentId = req.query.agentId as string | undefined;
  try {
    const files = storageService.listFiles(agentId);
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function get(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const agentId = req.query.agentId as string;
  try {
    const file = await storageService.download(id, agentId);
    res.setHeader('Content-Disposition', `attachment; filename="${id}"`);
    res.send(file);
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { agentId, filename, content } = req.body;
    if (!agentId || !filename || !content) {
      res
        .status(400)
        .json({ success: false, error: 'Missing required fields' });
    }

    const result = await storageService.uploadFile(agentId, content, filename);

    res.json({ success: true, file: result });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function createJSON(req: Request, res: Response): Promise<void> {
  try {
    const { agentId, filename, content } = req.body;
    let publicKey = req.body.publicKey;
    let signedMessage = req.body.signedMessage;
    if (!publicKey || !signedMessage) {
      publicKey = await getUserSecret(agentId, 'LIGHTHOUSE_PUBLIC_KEY');
      signedMessage = await getUserSecret(agentId, 'LIGHTHOUSE_JWT');
    }
    if (!agentId || !filename || !content || !publicKey || !signedMessage) {
      res
        .status(400)
        .json({ success: false, error: 'Missing required fields' });
    }

    const result = await storageService.uploadJSON(
      agentId,
      JSON.stringify(content),
      filename,
      publicKey,
      signedMessage,
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function deleteFile(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const agentId = req.query.agentId as string;
  try {
    await storageService.deleteFile(id, agentId);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Exchange a signed message for a Lighthouse JWT and store it in user secrets
 */
export async function getLighthouseJwt(
  req: Request,
  res: Response,
): Promise<void> {
  const { agentId, address, signature } = req.body;
  if (!agentId || !address || !signature) {
    res.status(400).json({
      success: false,
      error: 'Missing agentId, address, or signature',
    });
    return;
  }
  try {
    // Exchange signature for JWT
    const response = await axios.post(
      'https://encryption.lighthouse.storage/api/message/get-jwt',
      {
        address,
        signature,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
    const jwt = response.data.token;
    if (!jwt) {
      res.status(500).json({
        success: false,
        error: 'Failed to obtain JWT from Lighthouse',
      });
      return;
    }
    // Store JWT in user secrets
    setUserSecret(agentId, 'LIGHTHOUSE_JWT', jwt);
    res.json({ success: true, jwt });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function getLighthouseSignMessage(
  req: Request,
  res: Response,
): Promise<void> {
  const { address } = req.query;
  if (!address) {
    res.status(400).json({
      success: false,
      error: 'Missing address',
    });
    return;
  }
  try {
    const response = await axios.get(
      `https://encryption.lighthouse.storage/api/message/${address}`,
    );
    // The API returns an array of messages, use the first one
    res.json({ message: response.data[0].message });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
