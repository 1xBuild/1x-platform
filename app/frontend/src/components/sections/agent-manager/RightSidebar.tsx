import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { Agent } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';

interface RightSidebarProps {
  agent?: Agent | null;
  setActiveMainContent: (view: string) => void;
}

export default function RightSidebar({
  agent,
  setActiveMainContent,
}: RightSidebarProps) {
  const model = agent?.details?.model || '';

  const rightSidebarSections = [
    {
      id: 'model',
      title: 'Model',
      content: ({ agent, model }: { agent?: Agent | null; model: string }) =>
        !agent ? (
          <Skeleton className="h-9 w-full mb-2" />
        ) : (
          <Select>
            <SelectTrigger className="w-full text-foreground">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={model || 'no-model'}>
                {model || 'No model'}
              </SelectItem>
            </SelectContent>
          </Select>
        ),
      disabled: false,
    },
    {
      id: 'triggers',
      title: 'Triggers',
      description: 'Add and manage triggers for your agent',
      button: {
        label: 'Add trigger',
        icon: <Plus className="w-4 h-4 mr-1 text-accent" />,
        onClick: () => setActiveMainContent('triggers'),
      },
    },
    {
      id: 'tools',
      title: 'Tools',
      description:
        'Add tools to give your agents the ability to perform actions or connect with integrations.',
      button: {
        label: 'Add tool',
        icon: <Plus className="w-4 h-4 mr-1 text-accent" />,
        disabled: true,
      },
      disabled: true,
    },
    {
      id: 'knowledge',
      title: 'Knowledge',
      description:
        'Add knowledge to give your agents more customized, context-relevant responses.',
      button: {
        label: '',
        icon: <Plus className="w-4 h-4 text-accent" />,
        disabled: true,
      },
      disabled: true,
    },
  ];

  return (
    <div className="w-80 border-l border-border p-4 flex-shrink-0">
      <div className="space-y-6">
        {rightSidebarSections.map((section) => (
          <Card
            key={section.id}
            className={section.disabled ? 'opacity-50' : ''}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle
                  className={`text-sm font-medium ${section.disabled ? 'text-muted-foreground' : 'text-foreground'}`}
                >
                  {section.title}
                </CardTitle>
                {section.button && (
                  <Button
                    size="sm"
                    disabled={section.button.disabled}
                    className={section.disabled ? 'opacity-50' : ''}
                    onClick={section.button.onClick}
                  >
                    {section.button.icon}
                    {section.button.label}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {section.content ? (
                section.content({ agent, model })
              ) : (
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
