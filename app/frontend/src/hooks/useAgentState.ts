import { useState, useEffect } from "react";
import type { Agent } from "@/types/types";

export function useAgentState() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [localEdits, setLocalEdits] = useState<Partial<Agent["details"]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const defaultAgent: Agent = {
      id: "default",
      version: 1,
      details: {
        name: "No bot",
        description: "No description",
        systemPrompt: "No system prompt",
        persona: "No persona",
        model: "No model"
      }
    };
    setLoading(true);
    setError(null);
    fetch("/api/agents")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch agent");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAgent(data[0]);
        } else {
          setAgent(defaultAgent);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Unknown error");
        setAgent(defaultAgent);
        setLoading(false);
      });
  }, []);

  const editField = (field: keyof Agent["details"], value: string) => {
    setLocalEdits(edits => ({ ...edits, [field]: value }));
  };

  const getMergedAgent = () => {
    if (!agent) return null;
    return {
      ...agent,
      details: { ...agent.details, ...localEdits }
    };
  };

  const publish = async () => {
    if (!agent || !agent.id) return;
    setLoading(true);
    setError(null);
    const updatedAgent = {
      ...getMergedAgent(),
      version: agent.version + 1,
    };
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAgent),
      });
      if (!res.ok) throw new Error("Failed to update agent");
      setAgent({ ...(updatedAgent as Agent), details: updatedAgent.details! });
      setLocalEdits({});
      setLoading(false);
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      setLoading(false);
      return false;
    }
  };

  const reset = () => setLocalEdits({});

  return {
    agent: getMergedAgent(),
    editField,
    publish,
    reset,
    hasEdits: Object.keys(localEdits).length > 0,
    loading,
    error,
  };
}
