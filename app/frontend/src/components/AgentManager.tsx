import { useState, useRef } from "react";
import RightSidebar from "./sections/agent-manager/RightSidebar";
import Header from "./sections/agent-manager/Header";
import Sidebar from "./sections/agent-manager/Sidebar";
import MainContent from "./sections/agent-manager/MainContent";
import { useAgentState } from "@/hooks/useAgentState";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AgentManager() {
  const [selectedSection, setSelectedSection] = useState("system-prompt");
  const { agent, editField, publish, hasEdits, loading, error } = useAgentState();
  const lastErrorRef = useRef<string | null>(null);

  if (error && lastErrorRef.current !== error) {
    let displayError = error;
    if (error.includes("Unexpected token '<")) {
      displayError = "The backend did not return valid JSON. Is your API running?";
    }
    toast.error(displayError);
    lastErrorRef.current = error;
  }

  // Toast pour succès de publication
  const handlePublish = async () => {
    const success = await publish();
    if (success) toast.success("Agent updated!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <Loader2 className="animate-spin w-10 h-10 text-cyan-600" />
      </div>
    );
  }

  return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar
          selectedSection={selectedSection}
          setSelectedSection={setSelectedSection}
          agent={agent}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Header agent={agent} onPublish={handlePublish} publishDisabled={!hasEdits} />
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 flex flex-col min-w-0">
              <MainContent
                agent={agent}
                selectedSection={selectedSection}
                onEdit={(field, value) => editField(field, value)}
              />
            </div>
            <RightSidebar agent={agent} />
          </div>
        </div>
      </div>
  );
} 