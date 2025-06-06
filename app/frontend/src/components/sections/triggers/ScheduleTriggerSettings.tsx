import type { Agent } from '@/types/types';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ScheduleTriggerSettingsProps {
  agent: Agent;
  connected: Record<string, boolean>;
  setConnected: Dispatch<SetStateAction<Record<string, boolean>>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export default function ScheduleTriggerSettings({
  agent,
  connected,
  setConnected,
  loading,
  setLoading,
}: ScheduleTriggerSettingsProps) {
  const handleScheduleSwitch = async (checked: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/triggers/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked, agentId: agent.id }),
      });
      if (!response.ok) throw new Error('Erreur API');
      setConnected((prev) => ({ ...prev, Schedule: checked }));
      toast.success(`Schedule ${checked ? 'activé' : 'désactivé'} success !`);
    } catch (err) {
      toast.error('Impossible to update Schedule status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <Switch
        id="schedule-switch"
        checked={connected['Schedule']}
        onCheckedChange={handleScheduleSwitch}
        disabled={loading}
      />
      <Label htmlFor="schedule-switch" className="text-sm">
        {connected['Schedule'] ? 'Activé' : 'Désactivé'}
      </Label>
    </div>
  );
}
