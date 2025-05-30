import { useState, useEffect } from "react";
import type { Agent } from "@/types/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MainContentProps {
  agent?: Agent | null;
  selectedSection: string;
  onEdit?: (field: "systemPrompt" | "persona", value: string) => void;
}

export default function MainContent({ agent, selectedSection, onEdit }: MainContentProps) {
  const systemPrompt = agent?.details?.systemPrompt || "";
  const persona = agent?.details?.persona || "";
  const showPrompt = selectedSection === "system-prompt";
  const showPersona = selectedSection === "persona";

  const currentValue = showPrompt ? systemPrompt : persona;
  const field = showPrompt ? "systemPrompt" : "persona";

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentValue);

  // Synchronise editValue si la section ou la valeur courante change
  useEffect(() => {
    if (isEditing) {
      setEditValue(currentValue);
    }
  }, [selectedSection, isEditing, currentValue]);

  const handleEdit = () => {
    setEditValue(currentValue);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(currentValue);
  };

  const handleSave = () => {
    if (onEdit) onEdit(field, editValue);
    setIsEditing(false);
  };

  return (
    <div className="flex-1 h-full p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          {(showPrompt || showPersona) && (
            <Card>
              <CardHeader>
                <CardTitle>{showPrompt ? "System Prompt" : "Persona"}</CardTitle>
              </CardHeader>
              <CardContent>
                {!agent ? (
                  <Skeleton className="h-24 w-full mb-2" />
                ) : isEditing ? (
                  <>
                    <Textarea
                      className="w-full min-h-[120px] mb-2"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button className="text-chart-2" variant="secondary" onClick={handleSave}>Save</Button>
                      <Button className="text-destructive" variant="secondary" onClick={handleCancel}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="whitespace-pre-line text-base min-h-[80px]">
                      {currentValue || <span className="italic text-muted-foreground">{showPrompt ? "No system prompt" : "No persona"}</span>}
                    </div>
                    <Button className="mt-4 text-foreground hover:text-primary" variant="outline" size="sm" onClick={handleEdit}>Edit</Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}