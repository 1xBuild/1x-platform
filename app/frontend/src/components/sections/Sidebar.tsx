import { ChevronLeft, ChevronDown, FileText, Wrench, Brain, Zap, HelpCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Sidebar({ selectedSection, setSelectedSection }: { selectedSection: string, setSelectedSection: (id: string) => void }) {
    const sidebarItems = [
      { id: "prompt", label: "Prompt", icon: FileText, description: "Create guidelines for your agent" },
      { id: "tools", label: "Tools", icon: Wrench, description: "Used by agents to complete tasks", disabled: true },
      { id: "knowledge", label: "Knowledge", icon: Brain, description: "Add your documents and data", disabled: true },
      { id: "triggers", label: "Triggers", icon: Zap, description: "Run tasks on auto-pilot", disabled: true },
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
              <span className="font-medium">Agy, the telegram bot</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {sidebarItems.map((item) => {
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
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 ${item.disabled ? "text-gray-300" : "text-gray-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${item.disabled ? "text-gray-400" : "text-gray-900"}`}>{item.label}</div>
                    {item.description && (
                      <div className={`text-xs mt-0.5 ${item.disabled ? "text-gray-300" : "text-gray-500"}`}>{item.description}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <HelpCircle className="w-4 h-4" />
            Need help?
          </button>
        </div>
      </div>
    );
  }