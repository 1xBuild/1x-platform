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

const AGENTS = {
  MAIN: 'main-agent',
  ANALYST: 'analyst-agent',
  // etc.
};

const availableTriggers = [
  { name: 'Telegram', disabled: false, agents: [AGENTS.MAIN] },
  {
    name: 'Schedule',
    disabled: false,
    agents: [AGENTS.MAIN, AGENTS.ANALYST],
  },
];

export default function TriggersManager({ agent }: { agent: Agent }) {
  const filteredTriggers = availableTriggers.filter(
    (trigger) =>
      agent?.details?.name && trigger.agents.includes(agent.details.name),
  );

  const showTriggers = filteredTriggers.length > 0;
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

  useEffect(() => {
    if (!agent?.id) return;
    fetch(`${SERVER_URL}/api/triggers/telegram?agentId=${agent.id}`)
      .then((res) => res.json())
      .then((data) => {
        setConnected((prev) => ({ ...prev, Telegram: !!data.enabled }));
      });
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
    fetch(`${SERVER_URL}/api/triggers/schedule/all?agentId=${agent.id}`)
      .then((res) => res.json())
      .then((data) => {
        setScheduledTriggers(data.triggers || []);
      })
      .finally(() => setFetchingTriggers(false));
  }, [agent?.id, loading]);

  const handleToggleTrigger = async (trigger: any, enabled: boolean) => {
    // Update only the enabled state
    await fetch(`${SERVER_URL}/api/triggers/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...trigger,
        enabled,
        agentId: trigger.agent_id,
        id: trigger.id,
      }),
    });
    setScheduledTriggers((prev) =>
      prev.map((t) => (t.id === trigger.id ? { ...t, enabled } : t))
    );
  };

  const handleDeleteTrigger = async (trigger: any) => {
    setDeleteDialogOpen(true);
    setTriggerToDelete(trigger);
  };

  const confirmDeleteTrigger = async () => {
    if (!triggerToDelete) return;
    await fetch(`${SERVER_URL}/api/triggers/schedule`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: triggerToDelete.id, agentId: triggerToDelete.agent_id }),
    });
    setScheduledTriggers((prev) => prev.filter((t) => t.id !== triggerToDelete.id));
    setDeleteDialogOpen(false);
    setTriggerToDelete(null);
  };

  const refreshScheduledTriggers = () => {
    if (!agent?.id) return;
    setFetchingTriggers(true);
    fetch(`${SERVER_URL}/api/triggers/schedule/all?agentId=${agent.id}`)
      .then((res) => res.json())
      .then((data) => {
        setScheduledTriggers(data.triggers || []);
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
              {filteredTriggers.map((trigger) => (
                <Badge
                  key={trigger.name}
                  variant="outline"
                  className={`flex items-center gap-2 px-4 py-2 ${trigger.disabled ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${connected[trigger.name] ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  {trigger.name}
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
              <div className="text-muted-foreground">No scheduled triggers.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {scheduledTriggers.map((trigger) => (
                  <div key={trigger.id} className="flex items-center gap-4 p-2 border rounded">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${trigger.enabled ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    <span className="font-mono text-xs">
                      {String(trigger.hour).padStart(2, '0')}:{String(trigger.minute).padStart(2, '0')}
                    </span>
                    <span className="flex-1 truncate">{trigger.message}</span>
                    <Switch
                      checked={trigger.enabled}
                      onCheckedChange={(checked) => handleToggleTrigger(trigger, checked)}
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
            <CardTitle>{selectedTrigger === 'Schedule' ? 'Add a new Scheduled Trigger' : `${selectedTrigger} Settings`}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTrigger === 'Telegram' ? (
              <TelegramTriggerSettings
                agent={agent}
                connected={connected}
                setConnected={setConnected}
                loading={loading}
                setLoading={setLoading}
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
