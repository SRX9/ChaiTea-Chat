"use client";

import { useUser } from "@/lib/auth-client";
import { fontHeading } from "@/config/ts-style";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supportedModels, Model, EModelIntelligence } from "@/config/models";
import { Switch } from "@/components/ui/switch";
import { BrainCircuit, Search, ChevronDown, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AccountModelsPage() {
  const { user, isLoading } = useUser();
  // Stores IDs of disabled models. Models not in this list are considered enabled (turned on).
  const [disabledModels, setDisabledModels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMaxMode, setIsMaxMode] = useState(false);
  const [expandedModels, setExpandedModels] = useState<string[]>([]);

  const lsKey = user ? `${user.id}_models_selections` : null;
  const maxModeLsKey = user ? `${user.id}_max_mode` : null;

  useEffect(() => {
    if (lsKey) {
      const storedSelection = localStorage.getItem(lsKey);
      if (storedSelection) {
        try {
          setDisabledModels(JSON.parse(storedSelection));
        } catch {
          // Ignore parse errors and start with no disabled models
          setDisabledModels([]);
        }
      }
    }
    if (maxModeLsKey) {
      const storedMaxMode = localStorage.getItem(maxModeLsKey);
      if (storedMaxMode) {
        setIsMaxMode(JSON.parse(storedMaxMode));
      }
    }
  }, [lsKey, maxModeLsKey]);

  // `isEnabled` is the desired state AFTER the toggle.
  const handleModelSelection = (modelId: string, isEnabled: boolean) => {
    const newDisabled = isEnabled
      ? disabledModels.filter((id) => id !== modelId) // remove -> enabled
      : [...disabledModels, modelId]; // add -> disabled
    setDisabledModels(newDisabled);
    if (lsKey) {
      localStorage.setItem(lsKey, JSON.stringify(newDisabled));
    }
  };

  const handleMaxModeToggle = (enabled: boolean) => {
    setIsMaxMode(enabled);
    if (maxModeLsKey) {
      localStorage.setItem(maxModeLsKey, JSON.stringify(enabled));
    }
  };

  const toggleExpansion = (modelId: string) => {
    setExpandedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const filteredModels = supportedModels.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto  prose dark:prose-invert">
      <div
        className={cn(
          fontHeading.className,
          "text-lg pb-1 text-zinc-400 font-normal -tracking-tight"
        )}
      >
        Models
      </div>

      {/* Search and Model List */}
      <div className="mt-3">
        <div className="flex bg-card max-w-xs border-border rounded-md justify-start gap-3 relative">
          <Input
            placeholder="Search model..."
            value={searchQuery}
            className="bg-card max-w-xs"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="py-4 space-y-3">
          {filteredModels.map((model: Model) => {
            const isExpanded = expandedModels.includes(model.id);
            return (
              <div
                key={model.id}
                className="bg-card rounded-md overflow-hidden"
              >
                <div className="p-4 flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3">
                      {model.intelligence === EModelIntelligence.GENIUS && (
                        <BrainCircuit className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                      )}
                      <span className="text-base font-sans font-semibold text-foreground/90">
                        {model.name}
                      </span>
                      {model.maxOnly && (
                        <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded-sm">
                          MAX Only
                        </span>
                      )}
                    </div>
                    {model.description && (
                      <p className="text-sm text-zinc-400 mt-2 pr-4">
                        {model.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <Switch
                      checked={!disabledModels.includes(model.id)}
                      onChange={(e) =>
                        handleModelSelection(model.id, e.target.checked)
                      }
                    />
                    <button
                      onClick={() => toggleExpansion(model.id)}
                      className="p-1 rounded-md hover:bg-accent"
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-zinc-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border">
                    <div className="pt-3 text-sm text-zinc-400 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      <div className="capitalize">
                        <span className="font-medium text-zinc-300">
                          Owner:
                        </span>{" "}
                        {model.owner}
                      </div>
                      <div className="capitalize">
                        <span className="font-medium text-zinc-300">
                          Intelligence:
                        </span>{" "}
                        {model.intelligence}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-300">
                          Image Support:
                        </span>
                        {model.imageSupport ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-300">
                          Is Image Model:
                        </span>
                        {model.isImageModel ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      {model.isReasoning !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-300">
                            Reasoning:
                          </span>
                          {model.isReasoning ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <X className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      )}
                      <div className="col-span-full">
                        <span className="font-medium text-zinc-300">
                          Supported Modes:
                        </span>{" "}
                        {model.supportedModes.join(", ")}
                      </div>
                      {model.cost && (
                        <>
                          {model.isImageModel ? (
                            <>
                              <div className="col-span-full mt-2 font-medium text-zinc-300">
                                Pricing (per image operation)
                              </div>
                              {typeof model.cost.cost_per_image_operation ===
                                "number" && (
                                <div>
                                  <span className="font-medium text-zinc-300">
                                    Cost:
                                  </span>{" "}
                                  {`$${model.cost.cost_per_image_operation.toFixed(
                                    2
                                  )}`}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="col-span-full mt-2 font-medium text-zinc-300">
                                Pricing (per 1M tokens)
                              </div>
                              {typeof model.cost.input === "number" && (
                                <div>
                                  <span className="font-medium text-zinc-300">
                                    Input:
                                  </span>{" "}
                                  {`$${model.cost.input.toFixed(2)}`}
                                </div>
                              )}
                              {typeof model.cost.output === "number" && (
                                <div>
                                  <span className="font-medium text-zinc-300">
                                    Output:
                                  </span>{" "}
                                  {`$${model.cost.output.toFixed(2)}`}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
