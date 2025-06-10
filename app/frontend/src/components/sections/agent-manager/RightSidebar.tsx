import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Agent } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";

interface RightSidebarProps {
  agent?: Agent | null;
}

export default function RightSidebar({ agent }: RightSidebarProps) {
  const model = agent?.details?.model || "";
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 flex-shrink-0">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Model</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!agent ? (
              <Skeleton className="h-9 w-full mb-2" />
            ) : (
              <Select>
                <SelectTrigger className="w-full text-white">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={model || "no-model"}>{model || "No model"}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
        <Card className="opacity-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Tools</CardTitle>
              <Button size="sm" disabled className="opacity-50">
                <Plus className="w-4 h-4 mr-1" />
                Add tool
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-gray-300">
              Add tools to give your agents the ability to perform actions or connect with integrations.
            </p>
          </CardContent>
        </Card>
        <Card className="opacity-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">Knowledge</CardTitle>
              <Button size="sm" disabled className="opacity-50">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-gray-300">
              Add knowledge to give your agents more customized, context-relevant responses.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}