"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import { Sparkles, Gift, Lock, AlertCircle, Settings, CheckCircle2 } from "lucide-react";
import PinPad from "@/components/PinPad";
import RevealCard from "@/components/RevealCard";

interface Participant {
  id: string;
  name: string;
  subgroup: {
    id: string;
    name: string;
    color?: string | null;
  };
}

export default function HomePage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isDrawn, setIsDrawn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [selectedId, setSelectedId] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [hasDirectPin, setHasDirectPin] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reveal State
  const [revealData, setRevealData] = useState<{
    giverName: string;
    receiver: {
      name: string;
      subgroup: string;
      subgroupColor?: string | null;
    };
    eventDetails: {
      budget: string;
      eventDate: string;
      notes: string;
    };
  } | null>(null);

  useEffect(() => {
    fetchParticipants();
  }, []);

  // Pre-fill profile and PIN from URL query parameters (e.g. ?id=...&pin=...)
  useEffect(() => {
    if (participants.length > 0 && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prefillId = params.get("id") || params.get("p");
      const urlPin = params.get("pin") || params.get("code") || params.get("key");

      if (prefillId) {
        const found = participants.find((p) => p.id === prefillId);
        if (found) {
          setSelectedId(found.id);
          if (urlPin) {
            setPin(urlPin.trim());
            setHasDirectPin(true);
          }
        }
      }
    }
  }, [participants]);

  const fetchParticipants = async () => {
    try {
      const res = await fetch("/api/reveal");
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
        setIsDrawn(data.isDrawn || false);
      }
    } catch (err) {
      console.error("Failed to load participants:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSelection = () => {
    setSelectedId("");
    setPin("");
    setHasDirectPin(false);
    setErrorMessage(null);
    if (typeof window !== "undefined" && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      url.searchParams.delete("p");
      url.searchParams.delete("pin");
      url.searchParams.delete("code");
      url.searchParams.delete("key");
      window.history.replaceState({}, "", url.pathname);
    }
  };

  const handlePinSubmit = async (completedPin: string) => {
    if (!selectedId) {
      setErrorMessage("Bitte wähle zuerst deinen Namen aus.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: selectedId,
          pin: completedPin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Falsche PIN. Bitte versuche es erneut.");
        setPin("");
        setHasDirectPin(false);
      } else {
        setRevealData(data);
      }
    } catch (err) {
      setErrorMessage("Netzwerkfehler. Bitte versuche es erneut.");
      setPin("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseReveal = () => {
    setRevealData(null);
    setPin("");
    setSelectedId("");
    setHasDirectPin(false);
    setErrorMessage(null);
    if (typeof window !== "undefined" && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.delete("id");
      url.searchParams.delete("p");
      url.searchParams.delete("pin");
      url.searchParams.delete("code");
      url.searchParams.delete("key");
      window.history.replaceState({}, "", url.pathname);
    }
  };

  const selectedParticipant = participants.find((p) => p.id === selectedId);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
      }}
    >
      {/* Top Bar with Admin Link */}
      <header
        style={{
          width: "100%",
          maxWidth: "520px",
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "20px",
        }}
      >
        <a
          href="/admin"
          className="btn-festive-outline"
          style={{
            fontSize: "0.85rem",
            padding: "8px 14px",
            textDecoration: "none",
          }}
        >
          <Settings size={15} />
          Admin-Bereich
        </a>
      </header>

      {/* Main Content Card or Reveal Card */}
      {revealData ? (
        <RevealCard
          giverName={revealData.giverName}
          receiver={revealData.receiver}
          eventDetails={revealData.eventDetails}
          onClose={handleCloseReveal}
        />
      ) : (
        <div
          className="glass-panel"
          style={{
            width: "100%",
            maxWidth: "480px",
            padding: "36px 28px",
            textAlign: "center",
          }}
        >
          {/* Festive Icon & Header */}
          <div
            style={{
              width: "72px",
              height: "72px",
              margin: "0 auto 16px",
              borderRadius: "20px",
              background:
                "linear-gradient(135deg, rgba(225, 29, 72, 0.7) 0%, rgba(245, 158, 11, 0.6) 100%)",
              border: "1px solid rgba(251, 191, 36, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 8px 24px var(--accent-red-glow)",
            }}
            className="festive-glow"
          >
            <Gift size={36} />
          </div>

          <h1
            className="font-festive"
            style={{
              fontSize: "2.3rem",
              fontWeight: "700",
              color: "#ffffff",
              marginBottom: "8px",
            }}
          >
            Familien-Wichteln
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
              marginBottom: "28px",
            }}
          >
            {hasDirectPin
              ? `Hallo ${selectedParticipant?.name || ""}! Klicke unten, um dein Wichtelkind direkt aufzudecken.`
              : "Wähle deinen Namen und gib deine 4-stellige PIN ein, um dein Wichtelkind zu enthüllen."}
          </p>

          {/* Draw Status Indicator */}
          {!loading && (
            <div style={{ marginBottom: "24px" }}>
              {isDrawn ? (
                <div
                  className="badge badge-green"
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                >
                  <CheckCircle2 size={16} />
                  Auslosung erfolgt & bereit
                </div>
              ) : (
                <div
                  className="badge badge-gold"
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                >
                  <Sparkles size={16} />
                  Auslosung wird vorbereitet
                </div>
              )}
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div
              style={{
                background: "rgba(225, 29, 72, 0.15)",
                border: "1px solid rgba(225, 29, 72, 0.4)",
                color: "#fda4af",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "20px",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textAlign: "left",
              }}
            >
              <AlertCircle size={20} color="#fb7185" style={{ flexShrink: 0 }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Step 1: Select Name / Participant Display */}
          <div style={{ textAlign: "left", marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <label
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.02em",
                }}
              >
                {hasDirectPin ? "Teilnehmer:" : "1. Wer bist du?"}
              </label>
              {selectedId && (
                <button
                  type="button"
                  onClick={handleResetSelection}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--accent-gold)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Anderen Namen wählen
                </button>
              )}
            </div>

            {hasDirectPin && selectedParticipant ? (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(251, 191, 36, 0.3)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "1.05rem",
                }}
              >
                <span>{selectedParticipant.name}</span>
                <span
                  className="badge badge-gold"
                  style={{ fontSize: "0.8rem", padding: "4px 10px" }}
                >
                  {selectedParticipant.subgroup.name}
                </span>
              </div>
            ) : (
              <select
                className="festive-input"
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setErrorMessage(null);
                  setPin("");
                  setHasDirectPin(false);
                }}
                disabled={loading || submitting}
              >
                <option value="">-- Wähle deinen Namen --</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.subgroup.name})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2: Direct Reveal Button (WhatsApp link) OR Tactile PIN Pad */}
          {selectedId && hasDirectPin ? (
            <div style={{ animation: "fadeIn 0.3s ease-in" }}>
              <div
                style={{
                  background: "rgba(251, 191, 36, 0.08)",
                  border: "1px solid rgba(251, 191, 36, 0.3)",
                  borderRadius: "16px",
                  padding: "20px 18px",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "rgba(251, 191, 36, 0.15)",
                    color: "var(--accent-gold)",
                    marginBottom: "10px",
                    border: "1px solid rgba(251, 191, 36, 0.3)",
                  }}
                >
                  <Sparkles size={24} />
                </div>
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "700",
                    color: "#ffffff",
                    marginBottom: "6px",
                  }}
                >
                  Hallo {selectedParticipant?.name}! 🎄
                </div>
                <div
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--text-secondary)",
                    lineHeight: "1.4",
                  }}
                >
                  Dein persönlicher Link ist aktiviert – keine PIN-Eingabe nötig!
                </div>
              </div>

              <button
                type="button"
                onClick={() => handlePinSubmit(pin)}
                disabled={submitting}
                className="btn-festive-gold"
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 8px 24px var(--accent-gold-glow)",
                  cursor: "pointer",
                }}
              >
                {submitting ? (
                  <>
                    <Sparkles size={20} className="float-animation" />
                    Wichtel-Los wird geöffnet...
                  </>
                ) : (
                  <>
                    <Gift size={20} />
                    Wichtelkind jetzt enthüllen 🎁
                  </>
                )}
              </button>
            </div>
          ) : selectedId ? (
            <div style={{ animation: "fadeIn 0.3s ease-in" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  color: "var(--accent-gold)",
                  marginBottom: "16px",
                }}
              >
                <Lock size={15} />
                2. Deine 4-stellige Wichtel-PIN:
              </div>

              <PinPad
                pin={pin}
                onPinChange={(newPin) => {
                  setPin(newPin);
                  if (errorMessage) setErrorMessage(null);
                }}
                onSubmit={handlePinSubmit}
                disabled={submitting}
                isError={!!errorMessage}
              />

              {submitting && (
                <div
                  style={{
                    marginTop: "16px",
                    color: "var(--accent-gold)",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Sparkles size={16} className="float-animation" />
                  Wichtel-Los wird geöffnet...
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: "32px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "0.85rem",
        }}
      >
        Wichteln für die Großfamilie 🎄 &bull; wichteln.felixresch.com
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
