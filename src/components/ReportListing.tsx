import React, { useState } from "react";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
export function ReportListing({
  listingId,
  locale = "en",
  onRequireLogin,
}: {
  listingId: string;
  locale?: string;
  onRequireLogin?: (reason: string) => void;
}) {
  const pl = locale === "pl";
  const [open, setOpen] = useState(false),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState(""),
    [busy, setBusy] = useState(false);
  const report = useMutation(api.workflow.report);
  const { isAuthenticated } = useConvexAuth();
  return (
    <div className="space-y-3">
      <button
        type="button"
        className="text-xs font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {pl
          ? "Zgłoś problem z ogłoszeniem"
          : "Report a problem with this listing"}
      </button>
      {open && (
        <form
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!isAuthenticated) {
              onRequireLogin?.(
                pl
                  ? "Zaloguj się, aby wysłać zgłoszenie."
                  : "Sign in to submit a report.",
              );
              return;
            }
            setBusy(true);
            setError("");
            try {
              const id = await report({ listingId, reason });
              setReceipt(String(id));
              setReason("");
            } catch (e: any) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block text-xs font-semibold text-slate-700">
            {pl
              ? "Opisz problem (bez dokumentów z danymi osobowymi)"
              : "Describe the problem (do not include identity documents)"}
            <textarea
              required
              minLength={10}
              maxLength={3000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 w-full min-h-24 rounded-xl border border-slate-200 p-3 text-sm"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          )}
          {receipt && (
            <p role="status" className="text-sm text-indigo-700">
              {pl
                ? "Zapisano zgłoszenie. Numer: "
                : "Report received. Reference: "}
              {receipt}.{" "}
              {pl
                ? "Status sprawdzisz w My Place."
                : "Track its status in My Place."}{" "}
              <a
                href={
                  "mailto:info@relok8.online?subject=" +
                  encodeURIComponent("Report " + receipt)
                }
                className="underline"
              >
                {pl ? "Skontaktuj się z pomocą" : "Contact support"}
              </a>
            </p>
          )}
          <button
            disabled={busy || !!receipt}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50"
          >
            {busy
              ? pl
                ? "Wysyłanie…"
                : "Sending…"
              : pl
                ? "Wyślij zgłoszenie"
                : "Submit report"}
          </button>
        </form>
      )}
    </div>
  );
}
