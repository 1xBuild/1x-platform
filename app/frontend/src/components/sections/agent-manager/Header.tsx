import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Agent } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface HeaderProps {
  agent?: Agent | null;
  onPublish: () => void;
  publishDisabled: boolean;
}

function ConfirmModal({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Confirm publish</h2>
        <p className="mb-6">Are you sure you want to publish your changes?</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-muted text-foreground hover:bg-muted-foreground/10">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function Header({ agent, onPublish, publishDisabled }: HeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);

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
          <Button className="hover:text-primary" type="submit" onClick={handlePublishClick} disabled={publishDisabled}>Publish changes</Button>
        </div>
      </CardHeader>
      <ConfirmModal open={modalOpen} onConfirm={handleConfirm} onCancel={handleCancel} />
    </Card>
  );
}
