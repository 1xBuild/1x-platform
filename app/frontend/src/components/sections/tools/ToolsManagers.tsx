import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Agent } from '@/types/types';
import CryptoPanicToolSettings from './CryptoPanicToolSettings';
import { SERVER_URL } from '@/config';

const AGENTS = {
  MAIN: 'main-agent',
  ANALYST: 'analyst-agent',
  // etc.
};

const availableTools = [
  { name: 'CryptoPanic', disabled: false, agents: [AGENTS.MAIN] },
];

export default function ToolsManager({ agent }: { agent: Agent }) {
  const filteredTools = availableTools.filter(
    (tool) =>
      agent?.details?.name && tool.agents.includes(agent.details.name),
  );

  const showTools = filteredTools.length > 0;
  const [connected, setConnected] = useState(
    availableTools.reduce(
      (acc, tool) => {
        acc[tool.name] = false;
        return acc;
      },
      {} as Record<string, boolean>,
    ),
  );
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agent?.id) return;
    fetch(`${SERVER_URL}/api/tools/crypto-panic?agentId=${agent.id}`)
      .then((res) => res.json())
      .then((data) => {
        setConnected((prev) => ({ ...prev, CryptoPanic: !!data.enabled }));
      });
  }, [agent?.id]);

  useEffect(() => {
    setSelectedTool(null);
    setConnected(
      availableTools.reduce(
        (acc, tool) => {
          acc[tool.name] = false;
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
      {showTools ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {filteredTools.map((tool) => (
                <Badge
                  key={tool.name}
                  variant="outline"
                  className={`flex items-center gap-2 px-4 py-2 ${tool.disabled ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${connected[tool.name] ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  {tool.name}
                  <Button
                    size="sm"
                    variant="default"
                    className="ml-2"
                    disabled={tool.disabled}
                    onClick={() => setSelectedTool(tool.name)}
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

      {/* Tool Settings Panel */}
      {showTools && selectedTool && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTool} Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTool === 'CryptoPanic' ? (
              <CryptoPanicToolSettings
                agent={agent}
                connected={connected}
                setConnected={setConnected}
                loading={loading}
                setLoading={setLoading}
              />
            ) : null}
            <Button
              variant="outline"
              onClick={() => setSelectedTool(null)}
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
