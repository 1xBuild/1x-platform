import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Agent } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";

interface HeaderProps {
  agent?: Agent | null;
  onPublish: () => void;
  publishDisabled: boolean;
}

export default function Header({ agent, onPublish, publishDisabled }: HeaderProps) {
  const versions = agent ? [agent.version] : [];

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
          <Select>
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
          <Button className="hover:text-primary" type="submit" onClick={onPublish} disabled={publishDisabled}>Publish changes</Button>
        </div>
      </CardHeader>
    </Card>
  );
}
