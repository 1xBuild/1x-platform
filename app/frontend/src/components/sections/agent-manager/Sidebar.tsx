import { ChevronLeft, ChevronDown, FileText, Wrench, Brain, HelpCircle, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Agent } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function Sidebar({ selectedSection, setSelectedSection, agent }: { selectedSection: string, setSelectedSection: (id: string) => void, agent?: Agent | null }) {
    const sidebarItems = [
      { id: "system-prompt", label: "System Prompt", icon: FileText, description: "Create guidelines for your agent" },
      { id: "persona", label: "Persona", icon: User, description: "Create a persona for your agent" },
      { id: "tools", label: "Tools", icon: Wrench, description: "Used by agents to complete tasks", disabled: true },
      { id: "knowledge", label: "Knowledge", icon: Brain, description: "Add your documents and data", disabled: true },
    ];

    return (
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <ChevronLeft className="w-4 h-4" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-cyan-100 rounded flex items-center justify-center">
                <span className="text-cyan-600 text-xs font-bold">A</span>
              </div>
              {!agent ? (
                <>
                  <Skeleton className="h-4 w-20 mr-2" />
                  <Skeleton className="h-3 w-10 ml-2" />
                </>
              ) : (
                <>
                  <span className="font-medium">{agent.details?.name || "P33ly"}</span>
                  <span className="text-xs text-gray-400 ml-2">v{agent.version}</span>
                </>
              )}
              <ChevronDown className="w-4 h-4" />
            </div>
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
                      : "hover:bg-gray-50 " + (selectedSection === item.id ? "bg-gray-100" : "")
                  } ${idx !== sidebarItems.length - 1 ? "mb-2" : ""}`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 ${item.disabled ? "text-gray-400" : "text-cyan-600"}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${item.disabled ? "text-gray-400" : "text-white"}`}>{item.label}</div>
                    {item.description && (
                      <div className={`text-xs mt-0.5 ${item.disabled ? "text-gray-400" : "text-white"}`}>{item.description}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-4">
          <Button variant="outline" className="text-white hover:text-cyan-400">
          <HelpCircle className="w-4 h-4" />
            Need help?
          </Button>
        </div>
      </div>
    );
  }