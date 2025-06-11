import {FileText, Wrench, Brain, HelpCircle, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Agent } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ModeToggle } from "@/components/ModeToggle";

interface SidebarProps {
  selectedSection: string;
  setSelectedSection: (id: string) => void;
  agents: Agent[];
  setSelectedAgentId: (id: string) => void;
  selectedAgentId: string | null;
}

export default function Sidebar({ selectedSection, setSelectedSection, agents, setSelectedAgentId, selectedAgentId }: SidebarProps) {
    const sidebarItems = [
      { id: "persona", label: "Persona", icon: User, description: "Create a persona for your agent" },
      { id: "system-prompt", label: "System Prompt", icon: FileText, description: "Create guidelines for your agent" },
      { id: "tools", label: "Tools", icon: Wrench, description: "Used by agents to complete tasks", disabled: true },
      { id: "knowledge", label: "Knowledge", icon: Brain, description: "Add your documents and data", disabled: true },
    ];

    return (
      <div className="w-64 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="mb-2">
            <div className="text-xs text-muted-foreground mb-1">Your agents</div>
            {agents.length === 0 ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <Select value={selectedAgentId ?? undefined} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="w-full text-foreground">
                  <SelectValue placeholder="Sélectionner un agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(a => (
                    <SelectItem key={a.id} value={a.id!}>
                      {a.details.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {sidebarItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setSelectedSection(item.id)}
                  disabled={item.disabled}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-accent focus:bg-accent " + (selectedSection === item.id ? "bg-accent" : "")
                  } ${idx !== sidebarItems.length - 1 ? "mb-2" : ""}`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 ${item.disabled ? "text-muted-foreground" : (selectedSection === item.id ? "text-accent-foreground" : "text-foreground")}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${item.disabled ? "text-muted-foreground" : (selectedSection === item.id ? "text-accent-foreground" : "text-foreground")}`}>{item.label}</div>
                    {item.description && (
                      <div className={`text-xs mt-0.5 ${item.disabled ? "text-muted-foreground" : (selectedSection === item.id ? "text-accent-foreground" : "text-muted-foreground")}`}>{item.description}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-4 flex justify-between align-middle">
          <Button variant="outline" className="text-foreground hover:text-primary">
            <HelpCircle className="w-4 h-4 text-accent-foreground" />
            Need help?
          </Button>
          <div>
            <ModeToggle />
          </div>
        </div>
      </div>
    );
  }