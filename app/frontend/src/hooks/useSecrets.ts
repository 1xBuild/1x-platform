import { useState, useEffect, useCallback } from 'react';
import { SERVER_URL } from '@/config';

export function useSecrets(agentId?: string) {
  const [secretKeys, setSecretKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSecrets = useCallback(async () => {
    if (!agentId) {
      setSecretKeys([]);
      return;
    }

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
  }, [agentId]);

  const setSecret = useCallback(
    async (key: string, value: string): Promise<boolean> => {
      if (!agentId) return false;

      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    },
    [agentId, fetchSecrets],
  );

  const deleteSecret = useCallback(
    async (key: string): Promise<boolean> => {
      if (!agentId) return false;

      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    },
    [agentId, fetchSecrets],
  );

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

  return {
    secretKeys,
    loading,
    setSecret,
    deleteSecret,
    fetchSecrets,
  };
}
