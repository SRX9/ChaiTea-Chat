import { fontHeading } from "@/config/ts-style";
import { cn } from "@/lib/utils";

export default function AccountDocsPage() {
  return (
    <div className="max-w-2xl mx-auto  prose dark:prose-invert">
      <div
        className={cn(
          fontHeading.className,
          "text-lg pb-1 text-zinc-500 font-normal -tracking-tight"
        )}
      >
        Data & Security
      </div>

      {/* Local-first storage */}
      <section className="bg-card rounded-md p-4 mt-3 flex items-start gap-4">
        {/* Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-16 h-auto text-primary"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7.5A4.5 4.5 0 017.5 3h9A4.5 4.5 0 0121 7.5v9a4.5 4.5 0 01-4.5 4.5h-9A4.5 4.5 0 013 16.5v-9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 10.5h6M9 13.5h3"
          />
        </svg>
        <div>
          <div className="text-sm font-semibold font-sans pb-1 text-foreground/80">
            Local-first storage
          </div>
          <p className="text-sm text-zinc-400">
            Every chat message is first written to <code>IndexedDB</code> on
            your device. This keeps interactions lightning-fast and ensures the
            majority of your data never leaves your browser. A background sync
            process later replicates the data to our servers so you can
            seamlessly continue your conversations on any device.
          </p>
        </div>
      </section>

      {/* Encrypted key vault */}
      <section className="bg-card rounded-md p-4 mt-4 flex items-start gap-4">
        {/* Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-auto text-primary"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5v3a7.5 7.5 0 11-15 0v-3"
          />
        </svg>
        <div>
          <div className="text-sm font-semibold font-sans pb-1 text-foreground/80">
            Encrypted key vault
          </div>
          <p className="text-sm text-zinc-400">
            Provider API keys you add via <strong>Bring Your Own Key</strong>{" "}
            are encrypted <em>in your browser</em> before they touch the
            network. A high-level overview of the scheme:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-zinc-400">
            <li>
              <strong>Algorithm</strong>: AES-256-GCM (authenticated encryption)
              with a 96-bit IV and 128-bit auth tag.
            </li>
            <li>
              <strong>Key derivation</strong>: PBKDF2-HMAC-SHA-256.
            </li>
            <li>
              The resulting key <em>never</em> leaves your device; only the
              encrypted blob (IV + ciphertext) is optionally synced.
            </li>
            <li>
              All cryptographic operations rely on the Web Crypto API (or Node
              {"'"}s <code>crypto.webcrypto</code> where applicable).
            </li>
            <li>
              Data in transit is further protected by TLS 1.3 between your
              browser and our servers.
            </li>
          </ul>
        </div>
      </section>

      {/* Visual flow */}
      <section className="bg-card rounded-md p-4 mt-4 flex items-center justify-center gap-2 text-zinc-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7.5A4.5 4.5 0 017.5 3h9A4.5 4.5 0 0121 7.5v9a4.5 4.5 0 01-4.5 4.5h-9A4.5 4.5 0 013 16.5v-9z"
          />
        </svg>
        <span className="text-xs uppercase tracking-wide">IndexedDB</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 12l-3 3m0 0l-3-3m3 3V3"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 6A2.25 2.25 0 016.75 3.75h10.5A2.25 2.25 0 0119.5 6v12a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18V6z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 7.5h7.5M8.25 11.25h7.5M8.25 15h7.5"
          />
        </svg>
        <span className="text-xs uppercase tracking-wide">Remote DB</span>
      </section>
    </div>
  );
}
