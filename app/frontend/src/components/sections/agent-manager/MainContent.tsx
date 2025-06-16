import type { Agent } from '@/types/types';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import TriggersManager from '../triggers/TriggersManagers';
import { useEffect } from 'react';

interface MainContentProps {
  agent?: Agent | null;
  selectedSection: string;
  setSelectedSection: (id: string) => void;
  onEdit?: (field: 'systemPrompt' | 'persona', value: string) => void;
  hasEdits?: boolean;
  activeMainContent: string;
}

export default function MainContent({
  agent,
  selectedSection,
  setSelectedSection,
  onEdit,
  activeMainContent,
}: MainContentProps) {
  if (activeMainContent === 'triggers' && agent) {
    return <TriggersManager agent={agent} />;
  }

  const systemPrompt = agent?.details?.systemPrompt || '';
  const persona = agent?.details?.persona || '';
  const showPrompt = selectedSection === 'system-prompt';
  const showPersona = selectedSection === 'persona';

  const currentValue = showPrompt ? systemPrompt : showPersona ? persona : '';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!onEdit) return;

    const value = e.target.value;

    if (showPrompt) onEdit('systemPrompt', value);
    else if (showPersona) onEdit('persona', value);
  };

  const hasPersona = !!agent?.details?.persona;

  useEffect(() => {
    if (selectedSection === 'persona' && !hasPersona) {
      setSelectedSection('system-prompt');
    }
  }, [agent, selectedSection, hasPersona, setSelectedSection]);

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
                    placeholder={
                      showPrompt
                        ? 'No system prompt'
                        : showPersona
                          ? 'No persona'
                          : 'No system prompt'
                    }
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
