import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

export default function RightSidebar({ agent }: RightSidebarProps) {
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
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {section.content && section.content({ agent, model })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
