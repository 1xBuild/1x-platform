import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Agent } from '@/types/types';
import { Dispatch, SetStateAction } from 'react';
import { SERVER_URL } from '@/config';

interface TelegramTriggerSettingsProps {
  agent: Agent;
  connected: Record<string, boolean>;
  setConnected: Dispatch<SetStateAction<Record<string, boolean>>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export default function TelegramTriggerSettings({
  agent,
  connected,
  setConnected,
  loading,
  setLoading,
}: TelegramTriggerSettingsProps) {
  const handleTelegramSwitch = async (checked: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/triggers/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked, agentId: agent?.id }),
      });
      if (!response.ok) throw new Error('API error');
      setConnected((prev) => ({ ...prev, Telegram: checked }));
      toast.success(`Telegram ${checked ? 'enabled' : 'disabled'} with success !`);
    } catch (err) {
      toast.error('Impossible to update Telegram status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <Switch
        id="trigger-switch"
        checked={connected['Telegram']}
        onCheckedChange={handleTelegramSwitch}
        disabled={loading}
      />
      <Label htmlFor="trigger-switch" className="text-sm">
        {connected['Telegram'] ? 'Connected' : 'Disconnected'}
      </Label>
    </div>
  );
}
