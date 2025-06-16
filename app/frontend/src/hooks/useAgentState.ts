import { useState, useEffect } from 'react';
import type { Agent } from '@/types/types';
import { SERVER_URL } from '@/config';

export function useAgentState() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [localEdits, setLocalEdits] = useState<Partial<Agent['details']>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${SERVER_URL}/api/agents`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch agents');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAgents(data);
          setSelectedAgentId(data[0].id || null);
        } else {
          setAgents([]);
          setSelectedAgentId(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Unknown error');
        setAgents([]);
        setSelectedAgentId(null);
        setLoading(false);
      });
  }, []);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null;

  const editField = (field: keyof Agent['details'], value: string) => {
    setLocalEdits((edits) => ({ ...edits, [field]: value }));
  };

  const getMergedAgent = () => {
    if (!selectedAgent) return null;
    return {
      ...selectedAgent,
      details: { ...selectedAgent.details, ...localEdits },
    };
  };

  const publish = async () => {
    if (!selectedAgent || !selectedAgent.id) return;
    setLoading(true);
    setError(null);
    const updatedAgent = {
      ...getMergedAgent(),
      version: selectedAgent.version + 1,
    };
    try {
      const res = await fetch(`${SERVER_URL}/api/agents/${selectedAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAgent),
      });
      if (!res.ok) throw new Error('Failed to update agent');
      setAgents((prev) =>
        prev.map((a) =>
          a.id === selectedAgent.id
            ? { ...(updatedAgent as Agent), details: updatedAgent.details! }
            : a,
        ),
      );
      setLocalEdits({});
      setLoading(false);
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setLoading(false);
      return false;
    }
  };

  const reset = () => setLocalEdits({});

  return {
    agents,
    agent: getMergedAgent(),
    setSelectedAgentId,
    selectedAgentId,
    editField,
    publish,
    reset,
    hasEdits: Object.keys(localEdits).length > 0,
    loading,
    error,
    setAgents,
  };
}
