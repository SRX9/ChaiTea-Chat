import { fontHeading } from "@/config/ts-style";
import { cn } from "@/lib/utils";

export default function AccountBillingPage() {
  return (
    <div className="max-w-2xl mx-auto ">
      <div
        className={cn(
          fontHeading.className,
          "text-lg pb-1 text-zinc-500 font-normal -tracking-tight"
        )}
      >
        Billing
      </div>

      <section className="bg-card rounded-md p-4 mt-3">
        <p className="text-sm text-zinc-400">This page is coming soon.</p>
      </section>
    </div>
  );
}
