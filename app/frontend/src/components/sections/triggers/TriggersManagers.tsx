import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

const availableTriggers = [
  { name: 'Telegram', icon: '🟢', disabled: false },
  { name: 'Schedule', icon: '🟢', disabled: false },
  { name: 'Discord', icon: '🔗', disabled: true },
  { name: 'X', icon: '✈️', disabled: true },
];

export default function TriggersManager() {
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
    fetch('/api/triggers/telegram')
      .then((res) => res.json())
      .then((data) => {
        setConnected((prev) => ({ ...prev, Telegram: !!data.enabled }));
      });
  }, []);

  const handleTelegramSwitch = async (checked: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/triggers/telegram', {
        method: 'POST', // ou 'PATCH' selon ton backend
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked }),
      });
      if (!response.ok) throw new Error('Erreur API');
      setConnected((prev) => ({ ...prev, Telegram: checked }));
      toast.success(`Telegram ${checked ? 'activé' : 'désactivé'} success !`);
    } catch (err) {
      toast.error('Impossible to update Telegram status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Triggers</h1>
      <p className="text-muted-foreground mb-6">
        Triggers allow you to create tasks for your agent from schedules or
        integrations.
      </p>

      {/* Available Triggers */}
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

      <Separator className="my-6" />

      {/* Trigger Settings Panel */}
      {selectedTrigger && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTrigger} Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Switch
                id="trigger-switch"
                checked={connected[selectedTrigger]}
                onCheckedChange={
                  selectedTrigger === 'Telegram'
                    ? handleTelegramSwitch
                    : (checked) =>
                        setConnected((prev) => ({
                          ...prev,
                          [selectedTrigger]: checked,
                        }))
                }
                disabled={
                  loading ||
                  availableTriggers.find((t) => t.name === selectedTrigger)
                    ?.disabled
                }
              />
              <Label htmlFor="trigger-switch" className="text-sm">
                {connected[selectedTrigger] ? 'Connected' : 'Disconnected'}
              </Label>
            </div>
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
