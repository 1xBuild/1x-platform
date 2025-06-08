import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function RightSidebar() {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 flex-shrink-0">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Model</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white">
                <option>Gemini 2.0 flash</option>
                <option>GPT-4</option>
                <option>Claude 3.5 Sonnet</option>
                <option>Cost-optimized Model</option>
              </select>
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
          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Variables</CardTitle>
                <Button size="sm" disabled className="opacity-50">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-300">
                Want to reuse values through out your agent? Turn them into a variable that you can access with {"{{variable_name}}"}.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }