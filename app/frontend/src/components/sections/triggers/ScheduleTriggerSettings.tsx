import type { Agent } from '@/types/types';
import { Dispatch, SetStateAction } from 'react';

interface ScheduleTriggerSettingsProps {
  agent: Agent;
  connected: Record<string, boolean>;
  setConnected: Dispatch<SetStateAction<Record<string, boolean>>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export default function ScheduleTriggerSettings({
  agent,
  connected,
  setConnected,
  loading,
  setLoading,
}: ScheduleTriggerSettingsProps) {
  // TODO: Ajouter la logique de gestion du schedule ici
  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="text-muted-foreground">
        (Schedule settings UI à implémenter)
      </div>
      {/* Ajoute ici les champs de configuration, switch, etc. */}
    </div>
  );
}
