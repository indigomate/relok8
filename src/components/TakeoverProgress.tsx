import React, { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { backend } from "../lib/backend";
import { navigateTo, navigateToListing } from "../utils/router";
import { SupportedLocale } from "../utils/formatters";
export function TakeoverProgress({
  locale = "en",
  onRequireLogin,
}: {
  locale?: SupportedLocale;
  onRequireLogin: () => void;
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
        <h1 className="text-base font-bold">
          {say("My Place", "Moje miejsce")}
        </h1>
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
      <h2 className="text-lg font-bold text-slate-900">
        {say("Takeover requests and next steps", "Wnioski i kolejne kroki")}
      </h2>
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
                  input: { token },
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
      {places?.map((p: any) => (
        <section
          key={p.id}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4"
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
              <h2 className="text-base font-bold">{p.title}</h2>
              <p>
                {p.city} ·{" "}
                {p.status === "AVAILABLE"
                  ? say("Published", "Opublikowane")
                  : p.status === "PAUSED"
                    ? say("Paused", "Wstrzymane")
                    : p.status === "TRANSFERRED"
                      ? say("Handover complete", "Przekazanie zakończone")
                      : say("Handover in progress", "Przekazanie w toku")}
              </p>
            </div>
            <button
              className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold cursor-pointer"
              onClick={() => navigateToListing(p.id, p.title, locale)}
            >
              {say("View listing", "Zobacz ogłoszenie")}
            </button>
          </div>
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
                {say("Create invitation link", "Utwórz link zaproszenia")}
              </button>
              {inviteUrl && (
                <div className="space-y-2">
                  <p>
                    {say(
                      "Send this link to the landlord yourself. Relok8 has not sent an email. It expires after 7 days.",
                      "Wyślij link właścicielowi. Relok8 nie wysłał emaila. Link wygasa po 7 dniach.",
                    )}
                  </p>
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
            return (
              <article key={a.id} className="border-t pt-4 space-y-3">
                <h3 className="font-bold">
                  {a.name} · {status(a.status)}
                </h3>
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
                <div className="flex flex-wrap gap-2">
                  {p.landlord && a.status === "requested" && (
                    <>
                      <button
                        disabled={busy}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
                        onClick={() =>
                          run(() =>
                            decide({
                              applicationId: a.id,
                              decision: "approved",
                              reason: "",
                            }),
                          )
                        }
                      >
                        {say("Approve applicant", "Zatwierdź kandydata")}
                      </button>
                      <button
                        disabled={busy}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold disabled:opacity-50"
                        onClick={() => {
                          const reason = prompt(
                            say("Reason for declining", "Powód odmowy"),
                          );
                          if (reason)
                            run(() =>
                              decide({
                                applicationId: a.id,
                                decision: "declined",
                                reason,
                              }),
                            );
                        }}
                      >
                        {say("Decline", "Odrzuć")}
                      </button>
                    </>
                  )}
                  {!p.owner &&
                    !p.landlord &&
                    ["requested", "approved"].includes(a.status) && (
                      <button
                        disabled={busy}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold disabled:opacity-50"
                        onClick={() => {
                          const reason = prompt(
                            say("Reason for withdrawing", "Powód wycofania"),
                          );
                          if (reason)
                            run(() =>
                              decide({
                                applicationId: a.id,
                                decision: "withdrawn",
                                reason,
                              }),
                            );
                        }}
                      >
                        {say("Withdraw request", "Wycofaj wniosek")}
                      </button>
                    )}
                  {p.landlord && a.status === "approved" && (
                    <button
                      disabled={busy}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold disabled:opacity-50"
                      onClick={() => {
                        const reason = prompt(
                          say("Reason for cancelling", "Powód anulowania"),
                        );
                        if (reason)
                          run(() =>
                            decide({
                              applicationId: a.id,
                              decision: "cancelled",
                              reason,
                            }),
                          );
                      }}
                    >
                      {say("Cancel approval", "Anuluj zgodę")}
                    </button>
                  )}
                </div>
                {["approved", "completed"].includes(a.status) && (
                  <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                    <p>
                      {say(
                        "Arrange these steps directly. Each participant confirms their own experience. These are participant reports, not independently verified documents or payments.",
                        "Ustalcie te kroki bezpośrednio. Każda strona potwierdza własne ustalenia. Są to oświadczenia uczestników, a nie niezależna weryfikacja dokumentów lub płatności.",
                      )}
                    </p>
                    {(["documents", "deposit", "keys"] as const).map((s, i) => (
                      <div key={s}>
                        <label className="flex gap-3 items-start">
                          <input
                            className="mt-1"
                            type="checkbox"
                            disabled={busy || a.status === "completed"}
                            checked={!!a.confirmations?.[s]?.[role]?.confirmed}
                            onChange={(e) =>
                              run(() =>
                                confirm({
                                  applicationId: a.id,
                                  step: s,
                                  confirmed: e.target.checked,
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
              </article>
            );
          })}
        </section>
      ))}
      {!!reports?.length && (
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <h2 className="text-base font-bold">
            {say("Your reports", "Twoje zgłoszenia")}
          </h2>
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
        </section>
      )}
      <p className="text-sm">
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
