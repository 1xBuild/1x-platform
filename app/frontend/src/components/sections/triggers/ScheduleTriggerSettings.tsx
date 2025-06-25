import type { Agent } from '@/types/types';
import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { SERVER_URL } from '@/config';

import SecretManagement from '@/components/SecretManagement';

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
  const [schedule, setSchedule] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('');
  const [message, setMessage] = useState('');
  const [secrets, setSecrets] = useState<string[]>([]);

  // Define secrets for schedule triggers
  const requiredSecrets = ['TELEGRAM_MAIN_CHAT_ID'];
  const optionalSecrets: string[] = [];

  // Load existing secrets on component mount
  useEffect(() => {
    if (!agent?.id) return;

    const loadSecrets = async () => {
      try {
        const secretsResponse = await fetch(
          `${SERVER_URL}/api/secrets?userId=${agent.id}`,
        );
        if (secretsResponse.ok) {
          const secretsData = await secretsResponse.json();
          const secretsList = secretsData.secrets || [];
          setSecrets(secretsList);
        }
      } catch (error) {
        console.error('Error loading secrets:', error);
      }
    };

    loadSecrets();
  }, [agent?.id]);

  const resetForm = () => {
    setEnabled(false);
    setSchedule('0 10 * * *');
    setTimezone('Europe/London');
    setMessage('');
  };

  const hasAllRequiredSecrets = () => {
    return requiredSecrets.every((key) => secrets.includes(key));
  };

  const handleSecretsChange = (newSecrets: string[]) => {
    setSecrets(newSecrets);
  };

  const handleSave = async () => {
    if (!agent?.id) return;

    if (!hasAllRequiredSecrets()) {
      toast.error('Please set all required secrets before saving');
      return;
    }

    setLoading(true);
    try {
      const secretsConfig = Object.fromEntries(
        [...requiredSecrets, ...optionalSecrets]
          .filter((key) => secrets.includes(key))
          .map((key) => [key, key]),
      );

      const triggerConfig = {
        agent_id: agent.id,
        type: 'scheduled',
        enabled: true,
        config: {
          schedule,
          timezone,
          message,
          secrets: secretsConfig,
        },
      };

      console.log(
        '📤 [ScheduleTrigger] Sending trigger config:',
        triggerConfig,
      );

      const response = await fetch(`${SERVER_URL}/api/triggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(triggerConfig),
      });

      console.log('📥 [ScheduleTrigger] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [ScheduleTrigger] Save failed:', errorData);
        throw new Error('API error');
      }

      const responseData = await response.json();
      console.log('✅ [ScheduleTrigger] Save successful:', responseData);

      toast.success('Schedule trigger saved!');
      setConnected((prev) => ({ ...prev, Schedule: true }));
      resetForm();
      if (typeof onTriggerSaved === 'function') onTriggerSaved();
    } catch (err) {
      console.error('❌ [ScheduleTrigger] Save error:', err);
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

      {/* Schedule Trigger Secrets */}
      <SecretManagement
        agentId={agent?.id || ''}
        requiredSecrets={requiredSecrets}
        optionalSecrets={optionalSecrets}
        title="Schedule Trigger Secrets"
        onSecretsChange={handleSecretsChange}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="schedule-hour">Schedule (cron expression)</Label>
        <Input
          id="schedule-hour"
          type="text"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          placeholder="0 10 * * * (every day at 10:00)"
          disabled={loading}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="schedule-minute">Timezone</Label>
        <Input
          id="schedule-minute"
          type="text"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="Europe/London"
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
      <Button
        onClick={handleSave}
        disabled={loading || !hasAllRequiredSecrets()}
      >
        {loading ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
