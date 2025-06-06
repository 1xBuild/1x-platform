import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Agent } from '@/types/types';
import TelegramTriggerSettings from './TelegramTriggerSettings';
import ScheduleTriggerSettings from './ScheduleTriggerSettings';

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
  { name: 'Discord', disabled: true, agents: [AGENTS.MAIN] },
  { name: 'X', disabled: true, agents: [AGENTS.MAIN] },
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

  useEffect(() => {
    if (!agent?.id) return;
    const triggersToFetch = [
      { name: 'Telegram', endpoint: '/api/triggers/telegram' },
      { name: 'Schedule', endpoint: '/api/triggers/schedule' },
    ];
    triggersToFetch.forEach(({ name, endpoint }) => {
      fetch(`${endpoint}?agentId=${agent.id}`)
        .then((res) => res.json())
        .then((data) => {
          setConnected((prev) => ({ ...prev, [name]: !!data.enabled }));
        });
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

  return (
    <div className="max-w-3xl mx-auto p-6">
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

      {/* Trigger Settings Panel */}
      {showTriggers && selectedTrigger && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTrigger} Settings</CardTitle>
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
    </div>
  );
}
