"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, KeyRound, ArrowLeft, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Falsches Admin-Passwort.");
      } else {
        router.push("/admin");
      }
    } catch {
      setError("Verbindungsfehler beim Login.");
    } finally {
      setLoading(false);
    }
  };

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
          marginBottom: "clamp(32px, 6vw, 64px)",
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
        <span className="eyebrow" style={{ color: "var(--ink-primary)" }}>
          wichteln · zentrale
        </span>
        <a href="/" className="btn-festive-outline" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
          <ArrowLeft size={14} />
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
            Administration
          </span>
          <h1
            className="font-festive"
            style={{
              fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
              fontWeight: 700,
              lineHeight: 1.06,
              color: "var(--ink-primary)",
              marginBottom: "16px",
            }}
          >
            Admin-Bereich
          </h1>
          <p style={{ color: "var(--ink-secondary)", maxWidth: "38ch" }}>
            Verwalte Untergruppen, Teilnehmer-PINs, WhatsApp-Direktlinks, Auslosungen sowie
            Subadmin-Einladungen für weitere Communities.
          </p>
        </section>

        {/* Columns 6–12: Login Form Card */}
        <section
          className="portal-col-right stagger-in"
          style={{ ["--stagger-index" as string]: 2 }}
        >
          <div
            className="editorial-card-strong"
            style={{
              maxWidth: "460px",
              padding: "clamp(24px, 4vw, 36px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <span
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "var(--accent-tint)",
                  color: "var(--accent)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <KeyRound size={18} />
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--ink-primary)" }}>
                  Superadmin-Anmeldung
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--ink-muted)" }}>
                  Passwortgeschützter Zugang
                </div>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: "var(--status-err-bg)",
                  border: "1px solid var(--status-err-border)",
                  color: "var(--status-err-ink)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "18px",
                  fontSize: "0.88rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="admin-password"
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "var(--ink-secondary)",
                    marginBottom: "8px",
                  }}
                >
                  Master-Passwort
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="admin-password"
                    type="password"
                    className="festive-input"
                    placeholder="Passwort eingeben..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: "40px" }}
                    required
                    autoFocus
                  />
                  <Lock
                    size={16}
                    color="var(--ink-muted)"
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-festive-red"
                style={{ width: "100%", padding: "13px" }}
                disabled={loading}
              >
                {loading ? "Anmelden..." : "Einloggen"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
