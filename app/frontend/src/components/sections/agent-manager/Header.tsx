import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Agent } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { SERVER_URL } from "@/config";
import { toast } from "sonner";

interface HeaderProps {
  agent?: Agent | null;
  onPublish: () => void;
  publishDisabled: boolean;
  onAgentStatusChange?: (agent: Agent) => void;
}

function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  futureStatus,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  futureStatus?: 'enabled' | 'disabled' | null;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Confirm publish</h2>
        <p className="mb-6">Are you sure you want to apply your changes?</p>
        {futureStatus && (
          <div className="mb-4 text-center text-sm">
            The agent will be{" "}
            <span className={futureStatus === "enabled" ? "text-green-500" : "text-red-500"}>
              {futureStatus}
            </span>
            .
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-muted text-foreground hover:bg-muted-foreground/10">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Header({ agent, onPublish, publishDisabled, onAgentStatusChange }: HeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'enabled' | 'disabled' | null>(null);

  const versions = agent ? [agent.version] : [];

  const handlePublishClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setModalOpen(true);
  };

  const handleConfirm = () => {
    setModalOpen(false);
    onPublish();
  };

  const handleCancel = () => setModalOpen(false);

  const isAnalystAgent = agent?.details?.name === 'analyst-agent' || agent?.details?.name === 'analyst-agent-dev';
  const handleToggle = () => {
    setPendingStatus(agent?.status === 'enabled' ? 'disabled' : 'enabled');
    setToggleModalOpen(true);
  };
  const handleToggleConfirm = async () => {
    setToggleModalOpen(false);
    if (pendingStatus && agent) {
      try {
        const response = await fetch(`${SERVER_URL}/api/agents/${agent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...agent, status: pendingStatus }),
        });
        if (!response.ok) throw new Error("Failed to update agent status");
        const data = await response.json();
        if (onAgentStatusChange) onAgentStatusChange(data);
        toast.success(`Agent is now ${pendingStatus}`);
      } catch (e) {
        toast.error("Failed to update agent status");
      }
    }
    setPendingStatus(null);
  };
  const handleToggleCancel = () => {
    setToggleModalOpen(false);
    setPendingStatus(null);
  };

  return (
    <Card className="border-b-0 rounded-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-4 p-6 pb-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <span className="font-bold">A</span>
            </div>
            <div className="min-w-0">
              {agent ? (
                <CardTitle className="font-semibold text-xl mb-1 truncate">{agent.details?.name || "Agy, the telegram bot"}</CardTitle>
              ) : (
                <Skeleton className="h-6 w-40 mb-1" />
              )}
              {agent ? (
                <p className="text-sm text-muted-foreground truncate">{agent.details?.description || "Agy manages your telegram chat by engaging with users about crypto, memes and web3..."}</p>
              ) : (
                <Skeleton className="h-4 w-64" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Select disabled>
            <SelectTrigger className="w-32 text-foreground">
              <SelectValue placeholder="Versions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">V: {agent ? agent.version : <Skeleton className="h-4 w-12 inline-block align-middle" />}</SelectItem>
              {versions.map((v) => (
                <SelectItem key={v} value={String(v)}>V: {v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAnalystAgent && (
            <div className="flex items-center gap-2">
              <Switch
                checked={agent?.status === 'enabled'}
                onCheckedChange={handleToggle}
                id="analyst-agent-toggle"
              />
              <label htmlFor="analyst-agent-toggle" className="text-xs text-muted-foreground">
                {agent?.status === 'enabled' ? 'Enabled' : 'Disabled'}
              </label>
            </div>
          )}
          <Button className="hover:text-primary" type="submit" onClick={handlePublishClick} disabled={publishDisabled}>Publish changes</Button>
        </div>
      </CardHeader>
      <ConfirmModal open={modalOpen} onConfirm={handleConfirm} onCancel={handleCancel} />
      {isAnalystAgent && (
        <ConfirmModal
          open={toggleModalOpen}
          onConfirm={handleToggleConfirm}
          onCancel={handleToggleCancel}
          futureStatus={pendingStatus}
        />
      )}
    </Card>
  );
}
