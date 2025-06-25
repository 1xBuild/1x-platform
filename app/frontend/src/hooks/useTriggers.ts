import { useState, useEffect } from 'react';
import { SERVER_URL } from '@/config';

export interface TriggerConfig {
  enabled: boolean;
  secrets?: {
    [key: string]: string; // e.g., { botToken: "TELEGRAM_BOT_TOKEN" }
  };
  // Other trigger type configs can be added here
  [key: string]: any;
}

export interface TelegramTriggerConfig extends TriggerConfig {
  shouldAnswer?: {
    enabled: boolean;
    instruction: string;
  };
}

export interface ScheduledTriggerConfig extends TriggerConfig {
  schedule?: string; // cron expression like "0 10 * * *"
  message?: string;
  timezone?: string; // e.g., "America/New_York" or "Europe/Paris"
}

export interface Trigger {
  id: number;
  agent_id: string;
  type: string;
  enabled: boolean;
  config: TriggerConfig;
  created_at: string;
  updated_at: string;
}

export interface UpsertTriggerRequest {
  id?: number;
  agent_id: string;
  type: string;
  enabled: boolean;
  config: TriggerConfig;
  secrets?: { [key: string]: string };
}

export interface TriggerSecretRequirements {
  required: string[];
  optional: string[];
}

export function useTriggers(agentId: string | undefined) {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secretKeys, setSecretKeys] = useState<string[]>([]);

  const fetchTriggers = async () => {
    // If no agent is selected, immediately clear any stale triggers
    if (!agentId) {
      setTriggers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${SERVER_URL}/api/triggers?agentId=${agentId}`,
      );
      if (!response.ok) throw new Error('Failed to fetch triggers');

      const data = await response.json();
      setTriggers(data.triggers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching triggers:', err);
    } finally {
      setLoading(false);
    }
  };

  const upsertTrigger = async (
    triggerData: UpsertTriggerRequest,
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER_URL}/api/triggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(triggerData),
      });

      if (!response.ok) throw new Error('Failed to save trigger');

      // Refresh triggers after successful upsert
      await fetchTriggers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error upserting trigger:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTrigger = async (triggerId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER_URL}/api/triggers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: triggerId }),
      });

      if (!response.ok) throw new Error('Failed to delete trigger');

      // Refresh triggers after successful deletion
      await fetchTriggers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error deleting trigger:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get triggers by type
  const getTriggersByType = (type: string): Trigger[] => {
    return triggers.filter((trigger) => trigger.type === type);
  };

  // Get single trigger by type (for types that should have only one instance)
  const getTriggerByType = (type: string): Trigger | null => {
    const found = triggers.find((trigger) => trigger.type === type);
    return found || null;
  };

  // Fetch secrets for the agent
  const fetchSecrets = async () => {
    if (!agentId) return;

    try {
      const response = await fetch(
        `${SERVER_URL}/api/secrets?userId=${agentId}`,
      );
      if (!response.ok) throw new Error('Failed to fetch secrets');

      const data = await response.json();
      setSecretKeys(data.secrets || []);
    } catch (err) {
      console.error('Error fetching secrets:', err);
      setSecretKeys([]);
    }
  };

  // Set a secret
  const setSecret = async (key: string, value: string): Promise<boolean> => {
    if (!agentId) return false;

    try {
      const response = await fetch(`${SERVER_URL}/api/secrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: agentId, key, value }),
      });

      if (!response.ok) throw new Error('Failed to set secret');

      // Refresh secrets after successful set
      await fetchSecrets();
      return true;
    } catch (err) {
      console.error('Error setting secret:', err);
      return false;
    }
  };

  // Delete a secret
  const deleteSecret = async (key: string): Promise<boolean> => {
    if (!agentId) return false;

    try {
      const response = await fetch(`${SERVER_URL}/api/secrets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: agentId, key }),
      });

      if (!response.ok) throw new Error('Failed to delete secret');

      // Refresh secrets after successful deletion
      await fetchSecrets();
      return true;
    } catch (err) {
      console.error('Error deleting secret:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchTriggers();
    fetchSecrets();
  }, [agentId]);

  return {
    triggers,
    loading,
    error,
    secretKeys,
    fetchTriggers,
    fetchSecrets,
    upsertTrigger,
    deleteTrigger,
    getTriggersByType,
    getTriggerByType,
    setSecret,
    deleteSecret,
  };
}
