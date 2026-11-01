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
    } catch (err) {
      setError("Verbindungsfehler beim Login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "36px 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            margin: "0 auto 16px",
            borderRadius: "18px",
            background:
              "linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(225, 29, 72, 0.3) 100%)",
            border: "1px solid rgba(251, 191, 36, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fbbf24",
          }}
        >
          <KeyRound size={28} />
        </div>

        <h1
          className="font-festive"
          style={{ fontSize: "2rem", color: "#fff", marginBottom: "8px" }}
        >
          Admin-Bereich
        </h1>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            marginBottom: "24px",
          }}
        >
          Passwortgeschützter Bereich zur Verwaltung der Gruppen und Auslosung.
        </p>

        {error && (
          <div
            style={{
              background: "rgba(225, 29, 72, 0.15)",
              border: "1px solid rgba(225, 29, 72, 0.4)",
              color: "#fda4af",
              borderRadius: "12px",
              padding: "10px 14px",
              marginBottom: "20px",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textAlign: "left",
            }}
          >
            <AlertCircle size={18} color="#fb7185" style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px", textAlign: "left" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "8px",
                fontWeight: "500",
              }}
            >
              Master-Passwort
            </label>
            <div style={{ position: "relative" }}>
              <input
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
                size={18}
                color="#94a3b8"
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
            className="btn-festive-gold"
            style={{ width: "100%", padding: "14px" }}
            disabled={loading}
          >
            {loading ? "Anmelden..." : "Einloggen"}
          </button>
        </form>

        <div style={{ marginTop: "24px" }}>
          <a
            href="/"
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ArrowLeft size={14} />
            Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}
