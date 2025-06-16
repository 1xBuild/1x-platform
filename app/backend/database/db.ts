import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { IAgent } from '../types';

// Ensure the database directory exists
const dbDir = path.join(process.cwd(), './data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create and initialize the database
const dbPath = path.join(dbDir, 'local_db.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS uploaded_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, file_url)
  )
`);

// --- AGENTS TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    version INTEGER NOT NULL,
    details TEXT NOT NULL, -- JSON string
    status TEXT NOT NULL DEFAULT 'enabled'
  )
`);

// Migration: add status column if it doesn't exist
try {
  const columns = db.prepare('PRAGMA table_info(agents)').all();
  if (!columns.some((col: any) => col.name === 'status')) {
    db.exec(
      "ALTER TABLE agents ADD COLUMN status TEXT NOT NULL DEFAULT 'enabled'",
    );
  }
} catch (e) {
  console.error('Failed to migrate agents table to add status column:', e);
}

export default db;

/**
 * Check if a file has been uploaded to a source
 * @param sourceId - The ID of the source
 * @param fileUrl - The URL of the file
 * @returns Whether the file has been uploaded to the source
 */
export function isFileUploaded(sourceId: string, fileUrl: string): boolean {
  const stmt = db.prepare(
    'SELECT COUNT(*) as count FROM uploaded_files WHERE source_id = ? AND file_url = ?',
  );
  const result = stmt.get(sourceId, fileUrl) as { count: number };
  return result.count > 0;
}

/**
 * Mark a file as uploaded to a source
 * @param sourceId - The ID of the source
 * @param fileUrl - The URL of the file
 */
export function markFileAsUploaded(sourceId: string, fileUrl: string): void {
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO uploaded_files (source_id, file_url) VALUES (?, ?)',
  );
  stmt.run(sourceId, fileUrl);
}

export function listAgents(): IAgent[] {
  const stmt = db.prepare('SELECT * FROM agents');
  return (stmt.all() as any[]).map(
    (row: {
      id: string;
      version: number;
      details: string;
      status: string;
    }) => ({
      ...row,
      details: JSON.parse(row.details),
      status: row.status as import('../types').AgentStatus,
    }),
  );
}

export function getAgentById(id: string): IAgent | null {
  const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
  const row = stmt.get(id) as
    | { id: string; version: number; details: string; status: string }
    | undefined;
  return row
    ? {
        ...row,
        details: JSON.parse(row.details),
        status: row.status as import('../types').AgentStatus,
      }
    : null;
}

export function createAgent(agent: IAgent): void {
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO agents (id, version, details, status) VALUES (?, ?, ?, ?)',
  );
  stmt.run(
    agent.id,
    agent.version,
    JSON.stringify(agent.details),
    agent.status,
  );
}

export function updateAgent(agent: IAgent): void {
  const stmt = db.prepare(
    'UPDATE agents SET version = ?, details = ?, status = ? WHERE id = ?',
  );
  stmt.run(
    agent.version,
    JSON.stringify(agent.details),
    agent.status,
    agent.id,
  );
}

export function deleteAgent(id: string): void {
  const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
  stmt.run(id);
}
