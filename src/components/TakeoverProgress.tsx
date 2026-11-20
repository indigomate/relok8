import { timingLabels, leaseHasEnded } from '../utils/leaseTiming';
import { formatDate } from '../utils/formatters';
import { useState } from "react";
import { ApplicationDecision } from "./ApplicationDecision";
import { PropertySettings } from "./PropertySettings";
import { handoverProgress } from "../utils/handover";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { backend } from "../lib/backend";
import { navigateTo, navigateToListing } from "../utils/router";
import { SupportedLocale } from "../utils/formatters";
export function TakeoverProgress({
  locale = "en",
  onRequireLogin,
  onDeleteListing,
}: {
  locale?: SupportedLocale;
  onRequireLogin: () => void;
  onDeleteListing?: (id: string) => Promise<boolean | void> | void;
}) {
  const pl = locale === "pl",
    say = (en: string, po: string) => (pl ? po : en),
    prefix = pl ? "/pl" : "";
  const { isAuthenticated, isLoading } = useConvexAuth();
  const places = useQuery(api.workflow.activity, isAuthenticated ? {} : "skip");
  const reports = useQuery(
    api.workflow.myReports,
    isAuthenticated ? {} : "skip",
  );
  const decide = useMutation(api.workflow.decide),
    confirm = useMutation(api.workflow.confirm),
    publish = useMutation(api.workflow.publication),
    permission = useMutation(api.workflow.permission);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [inviteUrl, setInviteUrl] = useState(""),
    [inviteEmail, setInviteEmail] = useState(""),
    [invitePlace, setInvitePlace] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const selectedPlace = places?.find(p => p.id === selectedId) || places?.[0];
  const token = new URLSearchParams(window.location.search).get("invite");
  const invitation = useQuery(
    api.workflow.invitationPreview,
    isAuthenticated && token ? { token } : "skip",
  );
  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      window.dispatchEvent(new Event("relok8:workflow"));
      setNotice(say("Saved.", "Zapisano."));
    } catch (e: any) {
      setError(
        e.message ||
          say(
            "Could not save. Please try again.",
            "Nie udało się zapisać. Spróbuj ponownie.",
          ),
      );
    } finally {
      setBusy(false);
    }
  };
  const status = (s: string) =>
    ({
      requested: say(
        "Landlord review requested",
        "Oczekuje na decyzję właściciela",
      ),
      approved: say(
        "Approved · arrange handover",
        "Zatwierdzone · ustal przekazanie",
      ),
      declined: say("Declined", "Odrzucone"),
      withdrawn: say("Withdrawn", "Wycofane"),
      cancelled: say("Cancelled", "Anulowane"),
      expired: say(
        "Expired · submit a new request if still interested",
        "Wygasło · złóż nowy wniosek, jeśli nadal jesteś zainteresowany",
      ),
      completed: say(
        "Handover reported complete",
        "Zgłoszono zakończenie przekazania",
      ),
    })[s] || s;
  if (isLoading)
    return (
      <section className="" role="status">
        {say("Loading…", "Wczytywanie…")}
      </section>
    );
  if (!isAuthenticated)
    return (
      <section className=" space-y-5">
        <h2 className="text-base font-bold">
          {say("Sign in to manage your housing", "Zaloguj się, aby zarządzać najmem")}
        </h2>
        <p>
          {say(
            "Manage your listings, applications and landlord decisions in one place. If you received an invitation, sign in with the email it was addressed to.",
            "Zarządzaj ogłoszeniami, wnioskami i decyzjami właściciela w jednym miejscu. Jeśli masz zaproszenie, zaloguj się adresem email odbiorcy.",
          )}
        </p>
        <button
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
          onClick={onRequireLogin}
        >
          {say("Sign in to continue", "Zaloguj się, aby kontynuować")}
        </button>
      </section>
    );
  return (
    <section className="space-y-5 text-sm">

      {error && (
        <p role="alert" className="bg-red-50 text-red-700 p-4 rounded-xl">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {token && (
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
          <h2 className="text-base font-bold">
            {say("Landlord invitation", "Zaproszenie właściciela")}
          </h2>
          <p>
            {say(
              "Accept only if you are the landlord for the property shared by the sender. Invitations expire after 7 days and require the intended recipient’s verified email. Accepting does not approve an applicant.",
              "Zaakceptuj tylko, jeśli jesteś właścicielem lokalu wskazanego przez nadawcę. Zaproszenie wygasa po 7 dniach i wymaga zweryfikowanego emaila odbiorcy. Akceptacja nie zatwierdza kandydata.",
            )}
          </p>
          {invitation?.error ? (
            <p role="alert" className="text-rose-700">
              {invitation.error}
            </p>
          ) : (
            <p>
              {invitation?.title} · {invitation?.address}, {invitation?.city}
            </p>
          )}
          <button
            disabled={busy || !invitation || !!invitation.error}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
            onClick={() =>
              run(async () => {
                await backend().mutation(api.domain.write, {
                  operation: "acceptInvitation",
                  input: { token, locale },
                });
                navigateTo(prefix + "/place");
              })
            }
          >
            {say("Accept invitation", "Przyjmij zaproszenie")}
          </button>
        </section>
      )}
      {!places && (
        <p role="status">
          {say("Loading your activity…", "Wczytywanie aktywności…")}
        </p>
      )}
      {places?.length === 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <h2 className="text-base font-bold">
            {say("Your next move starts here", "Zacznij tutaj")}
          </h2>
          <p className="my-3">
            {say(
              "Find a room to message the tenant or request a takeover. Landlords can join through an invitation from the listing author.",
              "Znajdź pokój, aby napisać do najemcy lub poprosić o przejęcie najmu. Właściciele dołączają przez zaproszenie autora ogłoszenia.",
            )}
          </p>
          <button
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold disabled:opacity-50"
            onClick={() => navigateTo(prefix || "/")}
          >
            {say("Find a room", "Znajdź pokój")}
          </button>
        </section>
      )}
      {!!places?.length && <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <label className="grid gap-2 text-xs font-semibold text-slate-600 min-w-0 w-full sm:w-auto">
          {say("Select a home", "Wybierz lokal")} · {places.length}
          <select value={selectedPlace?.id || ""} disabled={busy} onChange={e => {setSelectedId(e.target.value); setInvitePlace(""); setInviteUrl(""); setError(""); setNotice("");}} className="w-full sm:max-w-sm min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900">
            {places.map(p => <option key={p.id} value={p.id}>{p.title} · {p.city}</option>)}
          </select>
        </label>
        <a className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700" href={prefix + '/messages'}>{say("Open Messages", "Otwórz Wiadomości")} →</a>
      </div>}
      {(selectedPlace ? [selectedPlace] : []).map((p: any) => (
        <section
          key={p.id}
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 space-y-6 min-w-0"
        >
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="text-sm text-indigo-700">
                {p.owner
                  ? say("Your listing", "Twoje ogłoszenie")
                  : p.landlord
                    ? say("Landlord", "Właściciel")
                    : say("Your application", "Twój wniosek")}
              </p>
              <h2 className="text-xl font-bold break-words">{p.title}</h2>
              <p>
                {p.city} ·{" "}
                {p.leaseEndDate && leaseHasEnded(p.leaseEndDate) ? say("Current lease ended · update dates", "Obecna umowa zakończona · zaktualizuj daty") : p.status === "AVAILABLE"
                  ? say("Published", "Opublikowane")
                  : p.status === "PAUSED"
                    ? say("Paused", "Wstrzymane")
                    : p.status === "TRANSFERRED"
                      ? say("Handover complete", "Przekazanie zakończone")
                      : say("Handover in progress", "Przekazanie w toku")}
              </p>
              {p.moveInDate && p.leaseEndDate && <p className="text-xs text-slate-600 mt-2">{timingLabels(p.occupancyStatus, locale).date}: {formatDate(p.moveInDate, locale)} · {timingLabels(p.occupancyStatus, locale).end}: {formatDate(p.leaseEndDate, locale)}</p>}
            </div>
            <button
              className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold cursor-pointer"
              onClick={() => navigateToListing(p.id, p.title, locale)}
            >
              {say("View listing", "Zobacz ogłoszenie")}
            </button>
          </div>
          {(p.owner || p.landlord) && <details className="border-y border-slate-100 py-4">
          <summary className="cursor-pointer min-h-11 py-3 font-semibold text-slate-700">{say("Listing settings & landlord", "Ustawienia ogłoszenia i właściciel")}</summary>
          <div className="pt-3 space-y-4">
          <p>
            {p.permission
              ? say(
                  "Landlord confirmed permission to advertise. Applicant approval is separate.",
                  "Właściciel potwierdził zgodę na ogłoszenie. Zgoda na kandydata jest osobna.",
                )
              : say(
                  "Permission to advertise is not confirmed by the landlord.",
                  "Zgoda na ogłoszenie nie została potwierdzona przez właściciela.",
                )}
          </p>
          {p.landlord && (
            <button
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold disabled:opacity-50"
              onClick={() =>
                run(() =>
                  permission({ listingId: p.id, approved: !p.permission }),
                )
              }
            >
              {p.permission
                ? say(
                    "Withdraw advertising permission",
                    "Wycofaj zgodę na ogłoszenie",
                  )
                : say(
                    "Confirm permission to advertise",
                    "Potwierdź zgodę na ogłoszenie",
                  )}
            </button>
          )}
          {p.owner && p.landlordPhone && <p className="text-xs text-slate-600">{say("Private landlord contact", "Prywatny kontakt do właściciela")} · <a href={`tel:${p.landlordPhone}`}>{p.landlordPhone}</a></p>}
          {p.owner && (
            <div className="flex flex-wrap gap-3">
              <button
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold disabled:opacity-50"
                onClick={() => {
                  setInvitePlace(p.id);
                  setInviteEmail(p.landlordEmail || "");
                  setInviteUrl("");
                }}
              >
                {say("Invite landlord", "Zaproś właściciela")}
              </button>
              {["AVAILABLE", "PAUSED"].includes(p.status) && (
                <button
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold disabled:opacity-50"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      publish({
                        listingId: p.id,
                        published: p.status === "PAUSED",
                      }),
                    )
                  }
                >
                  {p.status === "PAUSED"
                    ? say("Publish again", "Opublikuj ponownie")
                    : say("Pause listing", "Wstrzymaj ogłoszenie")}
                </button>
              )}
            </div>
          )}
          {invitePlace === p.id && (
            <form
              className="p-4 bg-slate-50 rounded-xl space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  const bytes = crypto.getRandomValues(new Uint8Array(32));
                  const token = Array.from(bytes, (b) =>
                    b.toString(16).padStart(2, "0"),
                  ).join("");
                  await backend().mutation(api.domain.write, {
                    operation: "invitation",
                    input: {
                      placeId: p.id,
                      email: inviteEmail,
                      role: "landlord",
                      token,
                      locale,
                    },
                  });
                  setInviteUrl(
                    window.location.origin + prefix + "/place?invite=" + token,
                  );
                });
              }}
            >
              <label className="grid gap-2">
                {say("Landlord email", "Email właściciela")}
                <input
                  type="email"
                  required
                  className="border rounded-xl p-3"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </label>
              <button
                disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {say("Email landlord invitation", "Wyślij zaproszenie właścicielowi")}
              </button>
              <button type="button" disabled={busy} className="min-h-11 px-4 text-sm font-semibold text-slate-600" onClick={() => setInvitePlace("")}>{say("Close", "Zamknij")}</button>
              {inviteUrl && (
                <div className="space-y-2">
                  <p>
                    {say(
                      "Relok8 emailed the invitation to the landlord. Keep this link as a fallback; it expires after 7 days.",
                      "Relok8 wysłał zaproszenie emailem do właściciela. Zachowaj ten link awaryjnie; wygasa po 7 dniach.",
                    )}
                  </p>
                  <button type="button" className="min-h-11 px-4 border rounded-xl text-sm font-semibold" onClick={async () => {try {await navigator.clipboard.writeText(inviteUrl); setNotice(say("Invitation link copied.", "Skopiowano link zaproszenia."));} catch {setError(say("Could not copy. Select and copy the link below.", "Nie udało się skopiować. Zaznacz i skopiuj link poniżej."));}}}>{say("Copy invitation link", "Kopiuj link zaproszenia")}</button>
                  <input
                    aria-label={say("Invitation link", "Link zaproszenia")}
                    readOnly
                    value={inviteUrl}
                    className="w-full border p-3 rounded-xl"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
              )}
            </form>
          )}
          {(p.owner || p.landlord) && <PropertySettings key={p.id} listingId={p.id} owner={p.owner} landlord={p.landlord} locale={locale} onDeleteListing={onDeleteListing} />}
          </div>
          </details>}
          <div className="space-y-2"><h3 className="text-base font-bold">{say("Takeover applications", "Wnioski o przejęcie najmu")} <span className="font-normal text-slate-500">({p.applications.length})</span></h3><p className="text-xs text-slate-500">{say("Open an application to review it, message the applicant or follow the handover.", "Otwórz wniosek, aby go rozpatrzyć, napisać do kandydata lub śledzić przekazanie.")}</p></div>
          {p.applications.length === 0 && (
            <p className="text-slate-600">
              {say(
                "No takeover requests yet. Enquiries appear in Messages.",
                "Brak wniosków o przejęcie najmu. Zapytania znajdziesz w Wiadomościach.",
              )}
            </p>
          )}
          {p.applications.map((a: any) => {
            const role = p.landlord
              ? "landlord"
              : p.owner
                ? "tenant"
                : "applicant";
            const progress = handoverProgress(a.confirmations, role);
            return (
              <details key={a.id} className="group rounded-xl border border-slate-200">
                <summary className="cursor-pointer p-4 min-h-14 break-words">
                  <span className="font-semibold">{a.name || say("Applicant", "Kandydat")}</span>
                  <span className="ml-3 text-xs text-slate-600">{status(a.status)}</span>
                  <span className="block mt-2 text-xs font-semibold text-indigo-700">{say("Review application & next steps", "Zobacz wniosek i kolejne kroki")}</span>
                </summary>
                <div className="border-t border-slate-100 p-4 sm:p-5 space-y-4">
                <p className="whitespace-pre-wrap">{a.message}</p><button type="button" className="text-xs font-semibold text-indigo-600" onClick={()=>navigateTo(prefix+'/messages',{thread:a.threadId || p.id+':'+a.applicantId})}>{say('Open conversation','Otwórz rozmowę')}</button>
                <p className="text-sm">
                  {say("Updated: ", "Aktualizacja: ")}
                  {new Date(a.updatedAt).toLocaleString(pl ? "pl-PL" : "en-GB")}
                </p>
                {a.reason && <p>{a.reason}</p>}
                {a.status === "requested" && (
                  <p>
                    {say(
                      "Next: the landlord reviews the request. This does not reserve the room or collect money. Expires: ",
                      "Dalej: właściciel rozpatruje wniosek. Wniosek nie rezerwuje pokoju ani nie pobiera środków. Ważny do: ",
                    )}
                    {new Date(a.expiresAt).toLocaleDateString()}
                  </p>
                )}
                <ApplicationDecision key={a.id + a.status} landlord={p.landlord} applicant={!p.owner && !p.landlord} status={a.status} busy={busy} locale={locale} onDecide={(decision, reason) => run(() => decide({applicationId: a.id, decision, reason, locale: locale === 'pl' ? 'pl' : 'en'}))} />
                {["approved", "completed"].includes(a.status) && (
                  <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                    <p className="text-xs text-slate-600">{say("All three participants confirm each stage. Arrange documents and payments directly; these updates are participant reports.", "Wszystkie trzy strony potwierdzają każdy etap. Dokumenty i płatności ustalacie bezpośrednio; aktualizacje są oświadczeniami uczestników.")}</p>
                    <p className="font-semibold text-indigo-800" role="status">
                      {!progress.currentStep
                        ? say("All handover stages confirmed by all three participants.", "Wszystkie trzy strony potwierdziły każdy etap przekazania.")
                        : progress.waitingForOthers
                          ? say("You have confirmed the current step. Waiting for the other participants below.", "Potwierdzono bieżący etap. Oczekujemy na pozostałych uczestników wskazanych poniżej.")
                          : say("Your next step: ", "Twój kolejny krok: ") + ({documents: say("confirm the signed agreement", "potwierdź podpisaną umowę"), deposit: say("confirm deposit arrangements", "potwierdź rozliczenie kaucji"), keys: say("confirm inspection and keys", "potwierdź odbiór lokalu i kluczy")})[progress.currentStep]}
                    </p>
                    {progress.steps.map(({step: s, locked}, i) => (
                      <div key={s}>
                        {locked && a.status !== "completed" && <p className="text-xs text-slate-600 mb-2">{a.confirmations?.[s]?.[role]?.confirmed
                          ? say("To correct this step, remove later confirmations first.", "Aby poprawić ten etap, najpierw usuń późniejsze potwierdzenia.")
                          : say("Available after all three participants confirm the earlier stages.", "Dostępne po potwierdzeniu wcześniejszych etapów przez wszystkie trzy strony.")}</p>}
                        <label className="flex gap-3 items-start">
                          <input
                            className="mt-1"
                            type="checkbox"
                            disabled={busy || a.status === "completed" || locked}
                            checked={!!a.confirmations?.[s]?.[role]?.confirmed}
                            onChange={(e) =>
                              run(() =>
                                confirm({
                                  applicationId: a.id,
                                  step: s,
                                  confirmed: e.target.checked,
                                  locale: locale === 'pl' ? 'pl' : 'en',
                                }),
                              )
                            }
                          />
                          <span>
                            {i + 1}.{" "}
                            {s === "documents"
                              ? say(
                                  "I confirm the required agreement is signed",
                                  "Potwierdzam podpisanie wymaganej umowy",
                                )
                              : s === "deposit"
                                ? say(
                                    "I confirm our agreed deposit arrangements are complete",
                                    "Potwierdzam zakończenie uzgodnionych rozliczeń kaucji",
                                  )
                                : say(
                                    "I confirm inspection and key handover are complete",
                                    "Potwierdzam odbiór lokalu i kluczy",
                                  )}
                          </span>
                        </label>
                        <p className="text-sm mt-2">
                          {["tenant", "landlord", "applicant"]
                            .map(
                              (r) =>
                                (r === "tenant"
                                  ? say(
                                      "Departing tenant",
                                      "Dotychczasowy najemca",
                                    )
                                  : r === "landlord"
                                    ? say("Landlord", "Właściciel")
                                    : say("Applicant", "Kandydat")) +
                                ": " +
                                (a.confirmations?.[s]?.[r]?.confirmed
                                  ? say("confirmed", "potwierdzono")
                                  : say("pending", "oczekuje")),
                            )
                            .join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </details>
            );
          })}
        </section>
      ))}
      {!!reports?.length && (
        <details className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <summary className="cursor-pointer font-semibold min-h-11">{say("Your reports", "Twoje zgłoszenia")} ({reports.length})</summary>
          {reports.map((r: any) => (
            <div key={r.id} className="mt-4">
              <p>
                {r.id} ·{" "}
                {r.status === "reviewed"
                  ? say("Reviewed", "Rozpatrzono")
                  : say(
                      "Received · awaiting review",
                      "Otrzymano · oczekuje na rozpatrzenie",
                    )}
              </p>
              <p>{r.reason}</p>
              {r.resolution && <p>{r.resolution}</p>}
            </div>
          ))}
        </details>
      )}
      <p className="text-xs text-slate-500">
        {say(
          "Need a correction or help with a dispute? Include the listing or report reference when contacting ",
          "Potrzebujesz poprawki lub pomocy w sporze? Podaj identyfikator ogłoszenia lub zgłoszenia, pisząc do ",
        )}
        <a
          className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold cursor-pointer"
          href="mailto:info@relok8.online"
        >
          info@relok8.online
        </a>
        .
      </p>
    </section>
  );
}
