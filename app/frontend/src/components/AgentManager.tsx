import { useState } from "react";
import RightSidebar from "./sections/agent-manager/RightSidebar";
import Header from "./sections/agent-manager/Header";
import Sidebar from "./sections/Sidebar";
import MainContent from "./sections/agent-manager/MainContent";



export default function AgentManager() {
  const [selectedSection, setSelectedSection] = useState("prompt");
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar selectedSection={selectedSection} setSelectedSection={setSelectedSection} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <MainContent />
          </div>
          <RightSidebar />
        </div>
      </div>
    </div>
  );
} 