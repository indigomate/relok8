import { useState } from "react";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/Button";
import { FormField } from "./ui/FormField";
import { StatusMessage } from "./ui/StatusMessage";
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
        className="min-h-11 text-xs font-semibold text-slate-600 hover:text-indigo-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="report-listing-form"
      >
        {pl
          ? "Zgłoś problem z ogłoszeniem"
          : "Report a problem with this listing"}
      </button>
      {open && (
        <form
          id="report-listing-form"
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3"
          aria-busy={busy}
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
            } catch (e: unknown) {
              setError(e instanceof Error ? e.message : pl ? "Nie udało się wysłać zgłoszenia." : "Could not submit the report.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <FormField
            label={pl
              ? "Opisz problem (bez dokumentów z danymi osobowymi)"
              : "Describe the problem (do not include identity documents)"}
            htmlFor="report-listing-reason"
            required
            hint={pl ? "Minimum 10 znaków. Nie dodawaj danych dokumentów ani płatności." : "Minimum 10 characters. Do not include document or payment details."}
          >
            <textarea
              id="report-listing-reason"
              required
              minLength={10}
              maxLength={3000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full min-h-24 rounded-xl border border-slate-300 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            />
          </FormField>
          {error && (
            <StatusMessage tone="error">{error}</StatusMessage>
          )}
          {receipt && (
            <StatusMessage tone="success" title={pl ? "Zgłoszenie zapisane" : "Report received"}>
              {pl
                ? "Numer zgłoszenia: "
                : "Reference: "}
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
            </StatusMessage>
          )}
          <Button
            type="submit"
            disabled={busy || !!receipt}
            aria-busy={busy}
          >
            {busy
              ? pl
                ? "Wysyłanie…"
                : "Sending…"
              : pl
                ? "Wyślij zgłoszenie"
                : "Submit report"}
          </Button>
        </form>
      )}
    </div>
  );
}
