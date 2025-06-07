import type { Agent } from '@/types/types';
import { Dispatch, SetStateAction, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { SERVER_URL } from '@/config';

interface ScheduleTriggerSettingsProps {
  agent: Agent;
  connected: Record<string, boolean>;
  setConnected: Dispatch<SetStateAction<Record<string, boolean>>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  onTriggerSaved?: () => void;
}

export default function ScheduleTriggerSettings({
  agent,
  setConnected,
  loading,
  setLoading,
  onTriggerSaved,
}: ScheduleTriggerSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState<number>(12);
  const [minute, setMinute] = useState<number>(0);
  const [message, setMessage] = useState('');

  const resetForm = () => {
    setEnabled(false);
    setHour(12);
    setMinute(0);
    setMessage('');
  };

  const handleSave = async () => {
    if (!agent?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/triggers/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          enabled: true,
          hour: Number(hour),
          minute: Number(minute),
          message,
        }),
      });
      if (!response.ok) throw new Error('API error');
      toast.success('Schedule trigger saved!');
      setConnected((prev) => ({ ...prev, Schedule: true }));
      resetForm();
      if (typeof onTriggerSaved === 'function') onTriggerSaved();
    } catch (err) {
      toast.error('Failed to save schedule trigger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex items-center gap-4">
        <Switch
          id="schedule-switch"
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={loading}
        />
        <Label htmlFor="schedule-switch" className="text-sm">
          {enabled ? 'Enabled' : 'Disabled'}
        </Label>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="schedule-hour">Hour (0-23)</Label>
        <Input
          id="schedule-hour"
          type="number"
          min={0}
          max={23}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          disabled={loading}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="schedule-minute">Minute (0-59)</Label>
        <Input
          id="schedule-minute"
          type="number"
          min={0}
          max={59}
          value={minute}
          onChange={(e) => setMinute(Number(e.target.value))}
          disabled={loading}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="schedule-message">Message to send</Label>
        <Textarea
          id="schedule-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
        />
      </div>
      <Button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
