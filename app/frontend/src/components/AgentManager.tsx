import { useState, useRef } from "react";
import RightSidebar from "./sections/agent-manager/RightSidebar";
import Header from "./sections/agent-manager/Header";
import Sidebar from "./sections/agent-manager/Sidebar";
import MainContent from "./sections/agent-manager/MainContent";
import { useAgentState } from "@/hooks/useAgentState";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Agent } from "@/types/types";

export default function AgentManager() {
  const [selectedSection, setSelectedSection] = useState("persona");
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const {
    agents,
    agent,
    setSelectedAgentId,
    selectedAgentId,
    editField,
    publish,
    hasEdits,
    reset,
    loading,
    error,
    setAgents,
  } = useAgentState();
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

  const handleSectionChange = (section: string) => {
    if (hasEdits) {
      setPendingSection(section);
      setShowUnsavedModal(true);
    } else {
      setSelectedSection(section);
    }
  };

  const handleConfirmSectionChange = () => {
    setShowUnsavedModal(false);
    setSelectedSection(pendingSection!);
    setPendingSection(null);
    reset();
  };

  const handleCancelSectionChange = () => {
    setShowUnsavedModal(false);
    setPendingSection(null);
  };

  const handleAgentStatusChange = (updatedAgent: Agent) => {
    // Update the agent in the agents array and in the selected agent
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-transparent">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        selectedSection={selectedSection}
        setSelectedSection={handleSectionChange}
        agents={agents}
        setSelectedAgentId={setSelectedAgentId}
        selectedAgentId={selectedAgentId}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header agent={agent} onPublish={handlePublish} publishDisabled={!hasEdits} onAgentStatusChange={handleAgentStatusChange} />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <MainContent
              agent={agent}
              selectedSection={selectedSection}
              onEdit={(field, value) => editField(field, value)}
              hasEdits={hasEdits}
            />
          </div>
          <RightSidebar agent={agent} />
        </div>
        {showUnsavedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm">
              <h2 className="text-lg font-semibold mb-4">Unsaved changes</h2>
              <p className="mb-6">You have unsaved changes. Are you sure you want to switch sections and lose your work?</p>
              <div className="flex justify-end gap-2">
                <button onClick={handleCancelSectionChange} className="px-4 py-2 rounded bg-muted text-foreground hover:bg-muted-foreground/10">Cancel</button>
                <button onClick={handleConfirmSectionChange} className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90">Switch</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 