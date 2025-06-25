// ⚠️ CRITICAL SECURITY WARNING ⚠️
// This component currently has NO user authentication!
// Any user can modify any agent's Telegram triggers.
// TODO: Add proper user authentication and authorization checks
// before allowing trigger modifications.

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import SecretManagement from '@/components/ui/SecretManagement';
import type { Agent } from '@/types/types';
import { Dispatch, SetStateAction } from 'react';
import { SERVER_URL } from '@/config';

interface TelegramTriggerSettingsProps {
  agent: Agent;
  connected: Record<string, boolean>;
  setConnected: Dispatch<SetStateAction<Record<string, boolean>>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  onStatusChange?: () => void;
}

export default function TelegramTriggerSettings({
  agent,
  connected,
  setConnected,
  loading,
  setLoading,
  onStatusChange,
}: TelegramTriggerSettingsProps) {
  const [shouldAnswerEnabled, setShouldAnswerEnabled] = useState(false);
  const [shouldAnswerInstruction, setShouldAnswerInstruction] = useState('');
  const [telegramTrigger, setTelegramTrigger] = useState<any>(null);
  const [secrets, setSecrets] = useState<string[]>([]);

  const requiredSecrets = ['TELEGRAM_BOT_TOKEN'];
  const optionalSecrets = [
    'TELEGRAM_BOT_ID',
    'TELEGRAM_CHAT_ID',
    'TELEGRAM_RESPOND_TO_MENTIONS',
    'TELEGRAM_RESPOND_TO_GENERIC',
  ];

  // Load telegram trigger
  useEffect(() => {
    if (!agent?.id) return;

    const loadData = async () => {
      try {
        // Load triggers
        const triggersResponse = await fetch(
          `${SERVER_URL}/api/triggers?agentId=${agent.id}`,
        );
        if (triggersResponse.ok) {
          const triggersData = await triggersResponse.json();
          const telegramTrigger = triggersData.triggers?.find(
            (t: any) => t.type === 'telegram',
          );
          setTelegramTrigger(telegramTrigger);

          if (telegramTrigger) {
            setShouldAnswerEnabled(
              telegramTrigger.config.shouldAnswer?.enabled || false,
            );
            setShouldAnswerInstruction(
              telegramTrigger.config.shouldAnswer?.instruction || '',
            );
            // Update connected state to reflect current trigger status
            setConnected((prev) => ({
              ...prev,
              Telegram: telegramTrigger.enabled,
            }));
          }
        }
      } catch (error) {
        console.error('Error loading telegram data:', error);
      }
    };

    loadData();
  }, [agent?.id]);

  const hasAllRequiredSecrets = () => {
    return requiredSecrets.every((key) => secrets.includes(key));
  };

  const handleSave = async () => {
    if (!agent?.id) {
      toast.error('No agent selected');
      return;
    }

    setLoading(true);

    try {
      const triggerData = {
        id: telegramTrigger?.id,
        agent_id: agent.id,
        type: 'telegram',
        enabled: connected['Telegram'] || false,
        config: {
          shouldAnswer: {
            enabled: shouldAnswerEnabled,
            instruction: shouldAnswerInstruction,
          },
          secrets: Object.fromEntries(
            [...requiredSecrets, ...optionalSecrets]
              .filter((key) => secrets.includes(key))
              .map((key) => [key, key]),
          ),
        },
      };

      const response = await fetch(`${SERVER_URL}/api/triggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(triggerData),
      });

      if (!response.ok) throw new Error('Failed to save trigger');

      toast.success('Telegram settings saved successfully');
    } catch (error) {
      toast.error('Failed to save Telegram settings');
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramSwitch = async (checked: boolean) => {
    console.log('🔄 handleTelegramSwitch called with:', checked);

    if (!hasAllRequiredSecrets() && checked) {
      console.log('❌ Missing required secrets');
      toast.error('Please set all required secrets before enabling Telegram');
      return;
    }

    console.log('⏳ Starting telegram switch operation...');
    setLoading(true);
    try {
      // Save the trigger configuration - this should handle bot start/stop automatically
      const triggerData = {
        id: telegramTrigger?.id,
        agent_id: agent.id,
        type: 'telegram',
        enabled: checked,
        config: {
          shouldAnswer: {
            enabled: shouldAnswerEnabled,
            instruction: shouldAnswerInstruction,
          },
          secrets: Object.fromEntries(
            [...requiredSecrets, ...optionalSecrets]
              .filter((key) => secrets.includes(key))
              .map((key) => [key, key]),
          ),
        },
      };

      console.log('📤 Sending trigger data:', triggerData);

      const response = await fetch(`${SERVER_URL}/api/triggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(triggerData),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Response error:', errorData);
        throw new Error(errorData.message || 'Failed to update trigger');
      }

      console.log('✅ Trigger updated successfully, refreshing state...');

      // Refresh trigger state from database to ensure UI is in sync
      const triggersResponse = await fetch(
        `${SERVER_URL}/api/triggers?agentId=${agent.id}`,
      );
      if (triggersResponse.ok) {
        const triggersData = await triggersResponse.json();
        console.log('📥 Refreshed triggers data:', triggersData);
        const updatedTelegramTrigger = triggersData.triggers?.find(
          (t: any) => t.type === 'telegram',
        );
        if (updatedTelegramTrigger) {
          console.log('🔄 Updating local state with:', updatedTelegramTrigger);
          setTelegramTrigger(updatedTelegramTrigger);
        }
      }

      // Notify parent to refresh both trigger and bot status
      onStatusChange?.();

      console.log('🎉 Operation completed successfully');
      toast.success(
        `Telegram ${checked ? 'enabled' : 'disabled'} successfully`,
      );
    } catch (error) {
      console.error('❌ Error in handleTelegramSwitch:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update Telegram status',
      );
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Toggle */}
      <div className="flex items-center gap-4">
        <Switch
          id="telegram-enabled"
          checked={connected['Telegram'] || false}
          onCheckedChange={handleTelegramSwitch}
          disabled={loading}
        />
        <Label htmlFor="telegram-enabled" className="text-sm">
          {connected['Telegram'] ? 'Enabled' : 'Disabled'}
        </Label>
        {!hasAllRequiredSecrets() && (
          <Badge variant="secondary" className="text-xs">
            Missing required secrets
          </Badge>
        )}
      </div>

      {/* Telegram Secrets */}
      <SecretManagement
        agentId={agent?.id || ''}
        requiredSecrets={requiredSecrets}
        optionalSecrets={optionalSecrets}
        title="Telegram Secrets"
        onSecretsChange={setSecrets}
      />

      {/* Should Answer Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Should Answer Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure custom rules for when the bot should respond to messages.
          </p>

          <div className="flex items-center space-x-2">
            <Switch
              id="shouldAnswer"
              checked={shouldAnswerEnabled}
              onCheckedChange={setShouldAnswerEnabled}
            />
            <Label htmlFor="shouldAnswer">Enable should answer filter</Label>
          </div>

          {shouldAnswerEnabled && (
            <div className="space-y-2">
              <Label htmlFor="shouldAnswerInstruction">
                Filter instruction
              </Label>
              <Textarea
                id="shouldAnswerInstruction"
                placeholder="Example: Only respond to messages about crypto trading, market analysis, or when someone asks about buying/selling cryptocurrencies. Ignore general chat and off-topic discussions."
                value={shouldAnswerInstruction}
                onChange={(e) => setShouldAnswerInstruction(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Describe when the bot should respond to messages. Be specific
                about the topics or types of messages you want the bot to
                handle.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
