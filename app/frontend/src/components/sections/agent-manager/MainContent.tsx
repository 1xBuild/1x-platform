import type { Agent } from '@/types/types';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MainContentProps {
  agent?: Agent | null;
  selectedSection: string;
  onEdit?: (field: 'systemPrompt' | 'persona', value: string) => void;
  hasEdits?: boolean;
}

export default function MainContent({
  agent,
  selectedSection,
  onEdit,
}: MainContentProps) {
  const systemPrompt = agent?.details?.systemPrompt || '';
  const persona = agent?.details?.persona || '';
  const showPrompt = selectedSection === 'system-prompt';
  const showPersona = selectedSection === 'persona';

  const currentValue = showPrompt ? systemPrompt : persona;
  const field = showPrompt ? 'systemPrompt' : 'persona';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onEdit) onEdit(field, e.target.value);
  };

  return (
    <div className="flex-1 h-full p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          {(showPrompt || showPersona) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {showPrompt ? 'System Prompt' : 'Persona'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!agent ? (
                  <Skeleton className="h-24 w-full mb-2" />
                ) : (
                  <Textarea
                    className="w-full min-h-[120px] mb-2"
                    value={currentValue}
                    onChange={handleChange}
                    disabled={!agent || showPrompt}
                    placeholder={showPrompt ? 'No system prompt' : 'No persona'}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
