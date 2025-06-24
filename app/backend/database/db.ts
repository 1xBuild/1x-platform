import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { IAgent } from '../types';
import { SecretManager } from '../services/secret-manager';

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

// --- GENERIC TRIGGERS TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS triggers (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'telegram', 'schedule', etc.
    enabled INTEGER NOT NULL DEFAULT 1,
    config TEXT NOT NULL, -- JSON string for type-specific config
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(id)
  )
`);

// --- USER SECRETS TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS user_secrets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value_encrypted BLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, key)
  )
`);

// --- BOTS TABLE ---
db.exec(`
  CREATE TABLE IF NOT EXISTS bots (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'telegram', 'discord'
    status TEXT NOT NULL DEFAULT 'stopped', -- 'running', 'stopped', 'error'
    config TEXT, -- JSON string for bot-specific config
    last_started TIMESTAMP,
    last_stopped TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, type),
    FOREIGN KEY(agent_id) REFERENCES agents(id)
  )
`);

export default db;

// --- USER SECRETS LOGIC ---
// ⚠️  CRITICAL SECURITY WARNING ⚠️
// These functions currently have NO user authentication/authorization!
// Any caller can access, modify, or delete any user's secrets.
// TODO: Implement proper user authentication before production use.

/**
 * Set (insert or update) a user secret (encrypted)
 * ⚠️  SECURITY: No authorization check - caller must verify user ownership!
 */
export function setUserSecret(
  userId: string,
  key: string,
  value: string,
): void {
  try {
    const value_encrypted = SecretManager.encrypt(value);
    db.prepare(
      `INSERT INTO user_secrets (id, user_id, key, value_encrypted) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, key) DO UPDATE SET value_encrypted=excluded.value_encrypted`,
    ).run(uuidv4(), userId, key, value_encrypted);
  } catch (error) {
    throw new Error(
      `Failed to store secret for user ${userId}, key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Get a user secret (decrypted)
 * ⚠️  SECURITY: No authorization check - caller must verify user ownership!
 */
export function getUserSecret(userId: string, key: string): string | null {
  try {
    const row = db
      .prepare(
        'SELECT value_encrypted FROM user_secrets WHERE user_id = ? AND key = ?',
      )
      .get(userId, key) as { value_encrypted: Buffer } | undefined;
    if (!row) return null;
    const value_encrypted = row.value_encrypted;
    return SecretManager.decrypt(value_encrypted);
  } catch (error) {
    throw new Error(
      `Failed to retrieve secret for user ${userId}, key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Delete a user secret
 * ⚠️  SECURITY: No authorization check - caller must verify user ownership!
 */
export function deleteUserSecret(userId: string, key: string): void {
  try {
    db.prepare('DELETE FROM user_secrets WHERE user_id = ? AND key = ?').run(
      userId,
      key,
    );
  } catch (error) {
    throw new Error(
      `Failed to delete secret for user ${userId}, key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * List all secret keys for a user (without values)
 * ⚠️  SECURITY: No authorization check - caller must verify user ownership!
 */
export function listUserSecretKeys(userId: string): string[] {
  try {
    const rows = db
      .prepare('SELECT key FROM user_secrets WHERE user_id = ?')
      .all(userId) as { key: string }[];
    return rows.map((row) => row.key);
  } catch (error) {
    throw new Error(
      `Failed to list secrets for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// --- BOT MANAGEMENT FUNCTIONS ---
export interface BotRecord {
  id: string;
  agent_id: string;
  type: string;
  status: 'running' | 'stopped' | 'error';
  config?: any;
  last_started?: string;
  last_stopped?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export function getBotsByAgentId(agent_id: string): BotRecord[] {
  const stmt = db.prepare('SELECT * FROM bots WHERE agent_id = ?');
  return stmt.all(agent_id).map((row: any) => ({
    ...row,
    config: row.config ? JSON.parse(row.config) : null,
  }));
}

export function getBotByAgentAndType(
  agent_id: string,
  type: string,
): BotRecord | null {
  const stmt = db.prepare('SELECT * FROM bots WHERE agent_id = ? AND type = ?');
  const row = stmt.get(agent_id, type) as any;
  return row
    ? {
        ...row,
        config: row.config ? JSON.parse(row.config) : null,
      }
    : null;
}

export function upsertBot(bot: {
  agent_id: string;
  type: string;
  status: 'running' | 'stopped' | 'error';
  config?: any;
  last_started?: string;
  last_stopped?: string;
  error_message?: string;
}): void {
  const stmt = db.prepare(`
    INSERT INTO bots (id, agent_id, type, status, config, last_started, last_stopped, error_message, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(agent_id, type) DO UPDATE SET
      status = excluded.status,
      config = excluded.config,
      last_started = excluded.last_started,
      last_stopped = excluded.last_stopped,
      error_message = excluded.error_message,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(
    uuidv4(), // Generate UUID for new bots
    bot.agent_id,
    bot.type,
    bot.status,
    bot.config ? JSON.stringify(bot.config) : null,
    bot.last_started,
    bot.last_stopped,
    bot.error_message,
  );
}

export function deleteBot(agent_id: string, type: string): void {
  const stmt = db.prepare('DELETE FROM bots WHERE agent_id = ? AND type = ?');
  stmt.run(agent_id, type);
}

export function listAllBots(): BotRecord[] {
  const stmt = db.prepare('SELECT * FROM bots ORDER BY agent_id, type');
  return stmt.all().map((row: any) => ({
    ...row,
    config: row.config ? JSON.parse(row.config) : null,
  }));
}

export function getActiveBots(): BotRecord[] {
  const stmt = db.prepare('SELECT * FROM bots WHERE status = ?');
  return stmt.all('running').map((row: any) => ({
    ...row,
    config: row.config ? JSON.parse(row.config) : null,
  }));
}

export function getActiveBotsByType(type: string): BotRecord[] {
  const stmt = db.prepare('SELECT * FROM bots WHERE status = ? AND type = ?');
  return stmt.all('running', type).map((row: any) => ({
    ...row,
    config: row.config ? JSON.parse(row.config) : null,
  }));
}

export function getRunningBotByAgentAndType(
  agent_id: string,
  type: string,
): BotRecord | null {
  const stmt = db.prepare(
    'SELECT * FROM bots WHERE agent_id = ? AND type = ? AND status = ?',
  );
  const row = stmt.get(agent_id, type, 'running') as any;
  return row
    ? {
        ...row,
        config: row.config ? JSON.parse(row.config) : null,
      }
    : null;
}

export function getAllRunningBotsByType(type: string): BotRecord[] {
  const stmt = db.prepare('SELECT * FROM bots WHERE type = ? AND status = ?');
  return stmt.all(type, 'running').map((row: any) => ({
    ...row,
    config: row.config ? JSON.parse(row.config) : null,
  }));
}

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

// --- GENERIC TRIGGERS LOGIC ---
export interface GenericTrigger {
  id: string;
  agent_id: string;
  type: string;
  enabled: boolean;
  config: any; // parsed JSON
  created_at: string;
  updated_at: string;
}

export function getTriggersByAgentId(agent_id: string): GenericTrigger[] {
  const stmt = db.prepare('SELECT * FROM triggers WHERE agent_id = ?');
  return stmt.all(agent_id).map((row: any) => ({
    ...row,
    enabled: !!row.enabled,
    config: JSON.parse(row.config),
  }));
}

export function getTriggerById(id: string): GenericTrigger | null {
  const stmt = db.prepare('SELECT * FROM triggers WHERE id = ?');
  const row = stmt.get(id) as any;
  return row
    ? {
        ...row,
        enabled: !!row.enabled,
        config: JSON.parse(row.config),
      }
    : null;
}

export function upsertTrigger(trigger: {
  id?: string;
  agent_id: string;
  type: string;
  enabled: boolean;
  config: any;
}): string {
  if (trigger.id) {
    const stmt = db.prepare(`
      UPDATE triggers
      SET enabled = ?, config = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      trigger.enabled ? 1 : 0,
      JSON.stringify(trigger.config),
      trigger.id,
    );
    return trigger.id;
  } else {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO triggers (id, agent_id, type, enabled, config)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      trigger.agent_id,
      trigger.type,
      trigger.enabled ? 1 : 0,
      JSON.stringify(trigger.config),
    );
    return id;
  }
}

export function deleteTrigger(id: string): void {
  const stmt = db.prepare('DELETE FROM triggers WHERE id = ?');
  stmt.run(id);
}

export function listAllTriggers(): GenericTrigger[] {
  const stmt = db.prepare('SELECT * FROM triggers');
  return stmt.all().map((row: any) => ({
    ...row,
    enabled: !!row.enabled,
    config: JSON.parse(row.config),
  }));
}

// --- SCHEDULE TRIGGER HELPERS ---
export function listScheduledTriggers(): GenericTrigger[] {
  const stmt = db.prepare(
    'SELECT * FROM triggers WHERE type = ? AND enabled = 1',
  );
  return stmt.all('scheduled').map((row: any) => ({
    ...row,
    enabled: !!row.enabled,
    config: JSON.parse(row.config),
  }));
}
