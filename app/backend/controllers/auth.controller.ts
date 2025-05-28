import { Request, Response } from 'express';

export function loginController(req: Request, res: Response) {
  const { id, password } = req.body;
  if (id === 'Rick' && password === 'ricksanchez') {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'Invalid credentials' });
} 