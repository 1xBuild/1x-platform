import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Agent } from '@/types/types';
import { Dispatch, SetStateAction } from 'react';
import { SERVER_URL } from '@/config';

interface CryptoPanicToolSettingsProps {
  agent: Agent;
  connected: Record<string, boolean>;
  setConnected: Dispatch<SetStateAction<Record<string, boolean>>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export default function CryptoPanicToolSettings({
  agent,
  connected,
  setConnected,
  loading,
  setLoading,
}: CryptoPanicToolSettingsProps) {
  const handleCryptoPanicSwitch = async (checked: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/tools/crypto-panic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked, agentId: agent?.id }),
      });
      if (!response.ok) throw new Error(response.statusText);
      setConnected((prev) => ({ ...prev, CryptoPanic: checked }));
      toast.success(
        `CryptoPanic ${checked ? 'enabled' : 'disabled'} with success !`,
      );
    } catch (err) {
      toast.error('Impossible to update CryptoPanic status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <Switch
        id="trigger-switch"
        checked={connected['CryptoPanic']}
        onCheckedChange={handleCryptoPanicSwitch}
        disabled={loading}
      />
      <Label htmlFor="trigger-switch" className="text-sm">
        {connected['CryptoPanic'] ? 'Connected' : 'Disconnected'}
      </Label>
    </div>
  );
}
