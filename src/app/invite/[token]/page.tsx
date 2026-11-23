"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Gift, Sparkles, Lock, Link2, AlertCircle, ArrowRight } from "lucide-react";

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function InviteRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === "string" ? params.token : "";

  const [checking, setChecking] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteLabel, setInviteLabel] = useState<string | null>(null);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const check = async () => {
      try {
        const res = await fetch(`/api/invite/${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setInviteValid(true);
          setInviteLabel(data.label || null);
        } else {
          setInviteValid(false);
          setInvalidReason(data.error || "Ungültiger Einladungslink.");
        }
      } catch {
        setInviteValid(false);
        setInvalidReason("Fehler beim Prüfen des Einladungslinks.");
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [token]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugifyName(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.trim().length < 6) {
      setError("Das Admin-Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/invite/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Community konnte nicht erstellt werden.");
      } else {
        router.push(`/c/${data.community.slug}/admin`);
      }
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className="portal-shell">
      <header
        className="stagger-in"
        style={{
          ["--stagger-index" as string]: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "16px",
          marginBottom: "clamp(28px, 5vw, 56px)",
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "var(--accent)",
              color: "var(--accent-ink)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Gift size={15} />
          </span>
          <span className="eyebrow" style={{ color: "var(--ink-primary)" }}>
            wichteln · einladung
          </span>
        </div>
        <a href="/" className="btn-festive-outline" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
          Zur Startseite
        </a>
      </header>

      <div className="portal-grid">
        {/* Columns 1–5: Editorial Context */}
        <section
          className="portal-col-left stagger-in"
          style={{ ["--stagger-index" as string]: 1 }}
        >
          <span className="eyebrow" style={{ display: "block", marginBottom: "12px" }}>
            Subadmin-Registrierung
          </span>
          <h1
            className="font-festive"
            style={{
              fontSize: "clamp(2.2rem, 4.2vw, 3.2rem)",
              fontWeight: 700,
              lineHeight: 1.06,
              color: "var(--ink-primary)",
              marginBottom: "16px",
            }}
          >
            Eigene Wichtel-Community erstellen
          </h1>
          <p style={{ color: "var(--ink-secondary)", maxWidth: "40ch", marginBottom: "20px" }}>
            Du erhältst eine eigene Teilnehmer-Seite unter <span className="font-mono-code">/c/…</span> sowie einen passwortgeschützten Admin-Bereich für deine Gruppe.
          </p>
          {inviteLabel && inviteValid && (
            <span className="badge badge-gold">
              <Sparkles size={14} />
              Einladung: {inviteLabel}
            </span>
          )}
        </section>

        {/* Columns 6–12: Form Card */}
        <section
          className="portal-col-right stagger-in"
          style={{ ["--stagger-index" as string]: 2 }}
        >
          <div className="editorial-card-strong" style={{ padding: "clamp(24px, 4vw, 36px)" }}>
            {checking ? (
              <div style={{ color: "var(--ink-secondary)", padding: "16px 0" }}>
                Einladungslink wird geprüft...
              </div>
            ) : !inviteValid ? (
              <div>
                <div
                  style={{
                    background: "var(--status-err-bg)",
                    border: "1px solid var(--status-err-border)",
                    color: "var(--status-err-ink)",
                    borderRadius: "10px",
                    padding: "14px 16px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{invalidReason}</span>
                </div>
                <a href="/" className="btn-festive-outline">
                  Zur Startseite
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {error && (
                  <div
                    style={{
                      background: "var(--status-err-bg)",
                      border: "1px solid var(--status-err-border)",
                      color: "var(--status-err-ink)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="community-name"
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--ink-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    Community-Name (erscheint als Titel)
                  </label>
                  <input
                    id="community-name"
                    type="text"
                    className="festive-input"
                    placeholder="z.B. Büro-Wichteln 2026"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    minLength={2}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="community-slug"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--ink-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    <Link2 size={14} />
                    URL-Kurzform (Slug)
                  </label>
                  <input
                    id="community-slug"
                    type="text"
                    className="festive-input font-mono-code"
                    placeholder="buero-wichteln-2026"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    }}
                    required
                    minLength={2}
                    maxLength={48}
                    disabled={submitting}
                  />
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "0.8rem",
                      color: "var(--ink-muted)",
                      wordBreak: "break-all",
                    }}
                  >
                    Teilnehmer-URL:{" "}
                    <span className="font-mono-code" style={{ color: "var(--ink-primary)", fontWeight: 600 }}>
                      {origin}/c/{slug || "deine-gruppe"}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="community-password"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--ink-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    <Lock size={14} />
                    Admin-Passwort (mind. 6 Zeichen)
                  </label>
                  <input
                    id="community-password"
                    type="password"
                    className="festive-input"
                    placeholder="Passwort für deinen Admin-Bereich"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="community-password-confirm"
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--ink-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    Admin-Passwort bestätigen
                  </label>
                  <input
                    id="community-password-confirm"
                    type="password"
                    className="festive-input"
                    placeholder="Passwort wiederholen"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={submitting}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-festive-red"
                  disabled={submitting}
                  style={{ width: "100%", padding: "14px", marginTop: "4px" }}
                >
                  {submitting ? (
                    "Community wird erstellt..."
                  ) : (
                    <>
                      Community erstellen &amp; starten
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
