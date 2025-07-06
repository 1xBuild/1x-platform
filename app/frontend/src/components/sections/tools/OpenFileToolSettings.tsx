import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Agent } from '@/types/types';
import { Dispatch, SetStateAction } from 'react';
import { SERVER_URL } from '@/config';

interface OpenFileToolSettingsProps {
  agent: Agent;
  connected: Record<string, boolean>;
  setConnected: Dispatch<SetStateAction<Record<string, boolean>>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export default function OpenFileToolSettings({
  agent,
  connected,
  setConnected,
  loading,
  setLoading,
}: OpenFileToolSettingsProps) {
  const handleOpenFileSwitch = async (checked: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/tools/open-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked, agentId: agent?.id }),
      });
      if (!response.ok) throw new Error(response.statusText);
      setConnected((prev) => ({ ...prev, OpenFile: checked }));
      toast.success(
        `OpenFile tool ${checked ? 'enabled' : 'disabled'} with success !`,
      );
    } catch (err) {
      toast.error('Impossible to update OpenFile tool status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <Switch
        id="openfile-switch"
        checked={connected['OpenFile']}
        onCheckedChange={handleOpenFileSwitch}
        disabled={loading}
      />
      <Label htmlFor="openfile-switch" className="text-sm">
        {connected['OpenFile'] ? 'Connected' : 'Disconnected'}
      </Label>
    </div>
  );
}
