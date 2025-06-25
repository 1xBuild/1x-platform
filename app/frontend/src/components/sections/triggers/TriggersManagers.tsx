import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Agent } from '@/types/types';
import TelegramTriggerSettings from './TelegramTriggerSettings';
import ScheduleTriggerSettings from './ScheduleTriggerSettings';
import { SERVER_URL } from '@/config';
import { Switch } from '@/components/ui/switch';
import ConfirmModal from '@/components/ui/ConfirmModal';

const availableTriggers = [
  { name: 'Telegram', disabled: false },
  { name: 'Schedule', disabled: false },
];

export default function TriggersManager({ agent }: { agent: Agent }) {
  const showTriggers = availableTriggers.length > 0;
  const [connected, setConnected] = useState(
    availableTriggers.reduce(
      (acc, trigger) => {
        acc[trigger.name] = false;
        return acc;
      },
      {} as Record<string, boolean>,
    ),
  );
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scheduledTriggers, setScheduledTriggers] = useState<any[]>([]);
  const [fetchingTriggers, setFetchingTriggers] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [triggerToDelete, setTriggerToDelete] = useState<any | null>(null);
  const [triggerStatuses, setTriggerStatuses] = useState<
    Record<
      string,
      {
        triggerEnabled: boolean;
        botRunning: boolean;
        isFullyActive: boolean;
      }
    >
  >({});

  const checkTriggerAndBotStatus = async () => {
    if (!agent?.id) return;

    try {
      // Check trigger status
      const triggersResponse = await fetch(
        `${SERVER_URL}/api/triggers?agentId=${agent.id}`,
      );
      const triggersData = await triggersResponse.json();
      const telegramTrigger = triggersData.triggers?.find(
        (t: any) => t.type === 'telegram',
      );

      // Check bot status
      const botStatusResponse = await fetch(
        `${SERVER_URL}/api/bots/status?agentId=${agent.id}`,
      );
      const botStatusData = await botStatusResponse.json();
      const telegramBotStatus = botStatusData.statuses?.telegram;

      console.log('🔍 [TriggersManager] Status check:', {
        triggerEnabled: !!telegramTrigger?.enabled,
        botRunning: !!telegramBotStatus?.running,
        triggerData: telegramTrigger,
        botData: telegramBotStatus,
      });

      // Store detailed status information
      const triggerEnabled = !!telegramTrigger?.enabled;
      const botRunning = !!telegramBotStatus?.running;
      const isFullyActive = triggerEnabled && botRunning;

      setTriggerStatuses((prev) => ({
        ...prev,
        Telegram: { triggerEnabled, botRunning, isFullyActive },
      }));

      setConnected((prev) => ({
        ...prev,
        Telegram: isFullyActive,
      }));
    } catch (error) {
      console.error('❌ [TriggersManager] Error checking status:', error);
      // On error, assume disconnected
      setConnected((prev) => ({
        ...prev,
        Telegram: false,
      }));
    }
  };

  useEffect(() => {
    checkTriggerAndBotStatus();
  }, [agent?.id]);

  useEffect(() => {
    setSelectedTrigger(null);
    setConnected(
      availableTriggers.reduce(
        (acc, trigger) => {
          acc[trigger.name] = false;
          return acc;
        },
        {} as Record<string, boolean>,
      ),
    );
  }, [agent?.id]);

  useEffect(() => {
    if (!agent?.id) return;
    setFetchingTriggers(true);
    fetch(`${SERVER_URL}/api/triggers?agentId=${agent.id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('data');
        console.log(data);
        const scheduleTriggersData =
          data.triggers?.filter((t: any) => t.type === 'scheduled') || [];
        // Transform the generic trigger format to the expected schedule format
        const transformedTriggers = scheduleTriggersData.map((t: any) => ({
          id: t.id,
          agent_id: t.agent_id,
          enabled: t.enabled,
          message: t.config.message,
          schedule: t.config.schedule,
          timezone: t.config.timezone,
        }));
        setScheduledTriggers(transformedTriggers);
      })
      .finally(() => setFetchingTriggers(false));
  }, [agent?.id, loading]);

  const handleToggleTrigger = async (trigger: any, enabled: boolean) => {
    // Update only the enabled state using generic trigger API
    await fetch(`${SERVER_URL}/api/triggers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: trigger.id,
        agent_id: trigger.agent_id,
        type: 'schedule',
        enabled,
        config: {
          schedule: trigger.schedule,
          timezone: trigger.timezone,
          message: trigger.message,
        },
      }),
    });
    setScheduledTriggers((prev) =>
      prev.map((t) => (t.id === trigger.id ? { ...t, enabled } : t)),
    );
  };

  const handleDeleteTrigger = async (trigger: any) => {
    setDeleteDialogOpen(true);
    setTriggerToDelete(trigger);
  };

  const confirmDeleteTrigger = async () => {
    if (!triggerToDelete) return;
    await fetch(`${SERVER_URL}/api/triggers`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: triggerToDelete.id,
      }),
    });
    setScheduledTriggers((prev) =>
      prev.filter((t) => t.id !== triggerToDelete.id),
    );
    setDeleteDialogOpen(false);
    setTriggerToDelete(null);
  };

  const refreshScheduledTriggers = () => {
    if (!agent?.id) return;
    setFetchingTriggers(true);
    fetch(`${SERVER_URL}/api/triggers?agentId=${agent.id}`)
      .then((res) => res.json())
      .then((data) => {
        const scheduleTriggersData =
          data.triggers?.filter((t: any) => t.type === 'schedule') || [];
        // Transform the generic trigger format to the expected schedule format
        const transformedTriggers = scheduleTriggersData.map((t: any) => ({
          id: t.id,
          agent_id: t.agent_id,
          enabled: t.enabled,
          schedule: t.config.schedule,
          timezone: t.config.timezone,
          message: t.config.message,
        }));
        setScheduledTriggers(transformedTriggers);
      })
      .finally(() => setFetchingTriggers(false));
  };

  return (
    <div className="max-w-3xl mx-auto p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-2">Triggers</h1>
      <p className="text-muted-foreground mb-6">
        Triggers allow you to create tasks for your agent from schedules or
        integrations.
      </p>

      {/* Available Triggers */}
      {showTriggers ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available triggers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {availableTriggers.map((trigger) => (
                <Badge
                  key={trigger.name}
                  variant="outline"
                  className={`flex items-center gap-2 px-4 py-2 ${trigger.disabled ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${connected[trigger.name] ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  {trigger.name}
                  {trigger.name === 'Telegram' && triggerStatuses.Telegram?.triggerEnabled && !triggerStatuses.Telegram?.botRunning && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      Trigger Only
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="default"
                    className="ml-2"
                    disabled={trigger.disabled}
                    onClick={() => setSelectedTrigger(trigger.name)}
                  >
                    Settings
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8 p-4 bg-muted rounded">
          <p className="text-muted-foreground">
            Aucun trigger disponible pour cet agent.
          </p>
        </div>
      )}

      <Separator className="my-6" />

      {/* Scheduled Triggers List - only show when Schedule is selected */}
      {selectedTrigger === 'Schedule' && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Scheduled triggers</CardTitle>
          </CardHeader>
          <CardContent>
            {fetchingTriggers ? (
              <div>Loading triggers...</div>
            ) : scheduledTriggers.length === 0 ? (
              <div className="text-muted-foreground">
                No scheduled triggers.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {scheduledTriggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="flex items-center gap-4 p-2 border rounded"
                  >
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${trigger.enabled ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    <span className="font-mono text-xs">
                      {trigger.schedule}
                    </span>
                    <span className="flex-1 truncate">{trigger.message}</span>
                    <Switch
                      checked={trigger.enabled}
                      onCheckedChange={(checked) =>
                        handleToggleTrigger(trigger, checked)
                      }
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTrigger(trigger)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trigger Settings Panel */}
      {showTriggers && selectedTrigger && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTrigger === 'Schedule'
                ? 'Add a new Scheduled Trigger (UTC time)'
                : `${selectedTrigger} Settings`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTrigger === 'Telegram' ? (
              <TelegramTriggerSettings
                agent={agent}
                connected={connected}
                setConnected={setConnected}
                loading={loading}
                setLoading={setLoading}
                onStatusChange={checkTriggerAndBotStatus}
              />
            ) : selectedTrigger === 'Schedule' ? (
              <ScheduleTriggerSettings
                agent={agent}
                connected={connected}
                setConnected={setConnected}
                loading={loading}
                setLoading={setLoading}
                onTriggerSaved={refreshScheduledTriggers}
              />
            ) : null}
            <Button
              variant="outline"
              onClick={() => setSelectedTrigger(null)}
              className="mt-2"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmModal
        open={deleteDialogOpen}
        onConfirm={confirmDeleteTrigger}
        onCancel={() => setDeleteDialogOpen(false)}
        title="Delete scheduled trigger?"
        message="Are you sure you want to delete this scheduled trigger?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
}
