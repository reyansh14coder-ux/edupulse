"use client";

import { useActionState } from "react";
import { Loader2, Printer, Share2 } from "lucide-react";
import { shareProgressAction, type ShareState } from "@/app/actions/share";
import { btnOutline } from "@/components/ui";

export function ShareReportButton({ label }: { label: string }) {
  const [state, action, pending] = useActionState<ShareState, FormData>(
    shareProgressAction,
    null
  );
  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <button type="submit" disabled={pending} className={btnOutline}>
          {pending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Share2 size={15} />
          )}
          {label}
        </button>
      </form>
      {state && (
        <p
          role="status"
          className="rounded-lg bg-mint-500/10 px-2.5 py-1.5 text-[12px] font-bold text-mint-600"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className={btnOutline} onClick={() => window.print()}>
      <Printer size={15} /> {label}
    </button>
  );
}
