import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export default function Header() {
    return (
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <span className="text-cyan-600 font-bold">A</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Agy, the telegram bot</h1>
                <p className="text-sm text-gray-500">
                  Agy manages your telegram chat by engaging with users about crypto, memes and web3...
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white">
              <option>Versions</option>
              <option>v1.0.0</option>
              <option>v0.9.2</option>
              <option>v0.9.1</option>
            </select>
            <Button data-publish>
              Publish changes
            </Button>
          </div>
        </div>
      </div>
    );
  }