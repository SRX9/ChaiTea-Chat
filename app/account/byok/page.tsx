"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/auth-client";
import { fontHeading } from "@/config/ts-style";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Check, ShieldCheck, Loader2 } from "lucide-react";
import { encryptString, decryptString } from "@/lib/crypto-utils";
import { getByokStorageKey } from "@/lib/byok";
import { ProviderId, providers, StoredObject, StoredProvider } from "./util";

// -- Crypto ------------------------------------------------------------------

const CHAI_SHIELD: string = process.env.NEXT_PUBLIC_CHAI_SHIELD || "";

export default function AccountBYOKPage() {
  const { user, isLoading: authLoading } = useUser();

  const [values, setValues] = useState<Record<ProviderId, string>>({
    openrouter: "",
    openai: "",
    anthropic: "",
    google: "",
    falai: "",
  });

  const [openaiCustomBaseUrl, setOpenaiCustomBaseUrl] = useState<string>("");
  const [isOpenaiBaseUrlEnabled, setIsOpenaiBaseUrlEnabled] = useState(false);

  const [saving, setSaving] = useState<ProviderId | null>(null);
  const [savedProvider, setSavedProvider] = useState<ProviderId | null>(null);

  const storageKey = user ? getByokStorageKey(user.id) : null;

  // Load stored keys on mount ------------------------------------------------
  useEffect(() => {
    if (!storageKey) return;

    const load = async () => {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      let stored: StoredObject;
      try {
        stored = JSON.parse(raw);
      } catch {
        stored = {};
      }

      const newValues = { ...values } as Record<ProviderId, string>;
      for (const prov of providers) {
        const sp = stored[prov.id as ProviderId];
        if (sp?.apiKey) {
          const decrypted = await decryptString(sp.apiKey, CHAI_SHIELD);
          newValues[prov.id as ProviderId] = decrypted;
        }
        if (prov.id === "openai" && sp?.baseURL) {
          setOpenaiCustomBaseUrl(sp.baseURL);
          setIsOpenaiBaseUrlEnabled(true);
        }
      }
      setValues(newValues);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  const handleValueChange = (id: ProviderId, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  };

  const handleSave = async (providerId: ProviderId) => {
    if (!storageKey) return;
    setSaving(providerId);
    try {
      const raw = localStorage.getItem(storageKey);
      let stored: StoredObject = raw ? JSON.parse(raw) : {};

      const encrypted = await encryptString(values[providerId], CHAI_SHIELD);
      const providerData: StoredProvider = { apiKey: encrypted };

      if (
        providerId === "openai" &&
        isOpenaiBaseUrlEnabled &&
        openaiCustomBaseUrl
      ) {
        providerData.baseURL = openaiCustomBaseUrl;
      }

      stored[providerId] = providerData;
      localStorage.setItem(storageKey, JSON.stringify(stored));
      setSavedProvider(providerId);
      setTimeout(() => setSavedProvider(null), 2000);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto  prose dark:prose-invert">
      <div
        className={cn(
          fontHeading.className,
          "text-lg pb-1 text-zinc-400 font-normal -tracking-tight"
        )}
      >
        Bring Your Own Key
      </div>
      <p className="text-sm text-zinc-400 mt-1">
        Securely store and manage your own provider API keys. These keys never
        leave your browser—only encrypted blobs are synced to our backend so
        that we can run requests on your behalf.
      </p>

      {/* Provider Sections */}
      <div className="mt-4 space-y-5">
        {providers.map((prov) => {
          const value = values[prov.id as ProviderId];
          const isSaving = saving === prov.id;
          const isSaved = savedProvider === prov.id;
          return (
            <section
              key={prov.id}
              className="bg-card rounded-md p-4 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold font-sans pb-2  text-foreground/60">
                  {prov.label}
                </div>
                {isSaved && <Check className="w-5 h-5 text-green-500" />}
              </div>
              <p className="text-sm text-zinc-400 -mt-2">{prov.description}</p>
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <Input
                  placeholder={prov.placeholder}
                  value={value}
                  onChange={(e) =>
                    handleValueChange(prov.id as ProviderId, e.target.value)
                  }
                  className="flex-grow border border-border p-3 "
                />
                <button
                  onClick={() => handleSave(prov.id as ProviderId)}
                  disabled={isSaving || !value}
                  className="px-4 py-2 rounded border border-border text-sm hover:bg-accent/20 flex items-center gap-2 min-w-[6rem] justify-center"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* Security Note */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-6">
        <ShieldCheck className="w-4 h-4" />
        <span>
          Your keys are encrypted in your browser with military-grade
          AES-256-GCM before storage.
        </span>
      </div>
    </div>
  );
}
