import { useState, useEffect, useCallback } from 'react';
import { SERVER_URL } from '@/config';

export interface BotStatus {
  type: string;
  running: boolean;
  lastStarted?: string;
  lastStopped?: string;
  error?: string;
}

export function useBots(agentId?: string) {
  const [botStatuses, setBotStatuses] = useState<Record<string, BotStatus>>({});
  const [loading, setLoading] = useState(false);

  const fetchBotStatuses = useCallback(async () => {
    if (!agentId) return;

    try {
      console.log('fetching bot statuses');
      const response = await fetch(
        `${SERVER_URL}/api/bots/status?agentId=${agentId}`,
      );
      console.log('response');
      console.log(response);
      if (!response.ok) {
        throw new Error('Failed to fetch bot statuses');
      }
      const data = await response.json();
      console.log('data');
      console.log(data);
      setBotStatuses(data.statuses || {});
    } catch (error) {
      console.error('Error fetching bot statuses:', error);
      setBotStatuses({});
    }
  }, [agentId]);

  const getBotStatus = useCallback(
    (botType: string): BotStatus | null => {
      return botStatuses[botType] || null;
    },
    [botStatuses],
  );

  const startBot = useCallback(
    async (botType: string): Promise<{ success: boolean; error?: string }> => {
      if (!agentId) return { success: false, error: 'No agent ID' };

      setLoading(true);
      try {
        const response = await fetch(`${SERVER_URL}/api/bots/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId, botType }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Update bot statuses to reflect the error
          await fetchBotStatuses();
          return { success: false, error: data.error || 'Failed to start bot' };
        }

        await fetchBotStatuses();
        return { success: true };
      } catch (error) {
        console.error('Error starting bot:', error);
        await fetchBotStatuses();
        return { success: false, error: 'Network error' };
      } finally {
        setLoading(false);
      }
    },
    [agentId, fetchBotStatuses],
  );

  const stopBot = useCallback(
    async (botType: string): Promise<boolean> => {
      if (!agentId) return false;

      setLoading(true);
      try {
        const response = await fetch(`${SERVER_URL}/api/bots/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId, botType }),
        });

        if (!response.ok) {
          throw new Error('Failed to stop bot');
        }

        await fetchBotStatuses();
        return true;
      } catch (error) {
        console.error('Error stopping bot:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [agentId, fetchBotStatuses],
  );

  useEffect(() => {
    fetchBotStatuses();
  }, [fetchBotStatuses]);

  return {
    botStatuses,
    loading,
    getBotStatus,
    startBot,
    stopBot,
    fetchBotStatuses,
  };
}
