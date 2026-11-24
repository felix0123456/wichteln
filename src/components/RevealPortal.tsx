"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Gift, Lock, AlertCircle, Settings, CheckCircle2, ArrowRight } from "lucide-react";
import PinPad from "@/components/PinPad";
import RevealCard from "@/components/RevealCard";
import { PineStarMark, HollySprig, NorthStarIcon } from "@/components/ChristmasMotifs";

interface Participant {
  id: string;
  name: string;
  subgroup: {
    id: string;
    name: string;
    color?: string | null;
  };
}

interface CommunityInfo {
  id: string;
  slug: string;
  name: string;
  isDefault: boolean;
}

interface RevealPortalProps {
  communitySlug?: string;
}

export default function RevealPortal({ communitySlug }: RevealPortalProps) {
  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isDrawn, setIsDrawn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedId, setSelectedId] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [hasDirectPin, setHasDirectPin] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  }, [communitySlug]);

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
      const query = communitySlug ? `?community=${encodeURIComponent(communitySlug)}` : "";
      const res = await fetch(`/api/reveal${query}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCommunity(data.community || null);
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
          ...(communitySlug ? { communitySlug } : {}),
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
    } catch {
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
  const adminHref = communitySlug ? `/c/${communitySlug}/admin` : "/admin";
  const pageTitle = community?.name || (communitySlug ? "Wichteln" : "Familien-Wichteln");

  if (notFound) {
    return (
      <main className="portal-shell">
        <div
          className="editorial-card-strong stagger-in"
          style={{ maxWidth: "480px", margin: "64px auto", padding: "36px 28px", textAlign: "left" }}
        >
          <span className="eyebrow" style={{ color: "var(--accent)" }}>
            404 · Nicht gefunden
          </span>
          <h1
            className="font-festive"
            style={{ fontSize: "2rem", margin: "10px 0 12px", lineHeight: 1.1 }}
          >
            Community nicht gefunden
          </h1>
          <p style={{ color: "var(--ink-secondary)", marginBottom: "24px" }}>
            Die gesuchte Wichtel-Gruppe existiert nicht oder wurde gelöscht.
          </p>
          <a href="/" className="btn-festive-outline">
            Zur Hauptseite
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="portal-shell">
      {/* Christmas Evergreen Masthead Bar */}
      <header
        className="christmas-masthead stagger-in"
        style={{
          ["--stagger-index" as string]: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--accent)",
              color: "var(--accent-ink)",
              border: "1px solid var(--brass)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Gift size={16} />
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <NorthStarIcon size={14} color="#B58428" />
            <span className="eyebrow" style={{ color: "var(--ink-on-pine)" }}>
              {communitySlug ? `weihnachtswichteln / ${communitySlug}` : "weihnachtswichteln · advent 2026"}
            </span>
          </div>
        </div>

        <a href={adminHref} className="btn-masthead-outline">
          <Settings size={14} />
          Admin-Bereich
        </a>
      </header>

      {/* 12-Column Asymmetric Layout */}
      <div className="portal-grid">
        {/* Columns 1–5: Editorial Intro, Pine Emblem & Gift Ledger */}
        <section
          className="portal-col-left stagger-in"
          style={{ ["--stagger-index" as string]: 1 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <PineStarMark size={44} />
            <span className="eyebrow" style={{ color: "var(--accent)" }}>
              Frohe Bescherung · Losziehung
            </span>
          </div>

          <h1
            className="font-festive"
            style={{
              fontSize: "clamp(2.35rem, 4.5vw, 3.6rem)",
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              color: "var(--ink-primary)",
              marginBottom: "18px",
            }}
          >
            {pageTitle}
          </h1>

          <p
            style={{
              color: "var(--ink-secondary)",
              fontSize: "1.02rem",
              lineHeight: 1.55,
              marginBottom: "24px",
              maxWidth: "42ch",
            }}
          >
            {hasDirectPin
              ? `Hallo ${selectedParticipant?.name || ""}! Dein persönlicher Einladungslink ist aktiv – decke jetzt dein geheimes Wichtelkind auf.`
              : "Wähle deinen Namen aus der Liste und gib deine persönliche 4-stellige PIN ein, um dein Wichtelkind zu enthüllen."}
          </p>

          {!loading && (
            <div style={{ marginBottom: "32px" }}>
              {isDrawn ? (
                <span className="badge badge-green" style={{ padding: "6px 14px", fontSize: "0.84rem" }}>
                  <CheckCircle2 size={15} />
                  Auslosung erfolgt &amp; bereit
                </span>
              ) : (
                <span className="badge badge-gold" style={{ padding: "6px 14px", fontSize: "0.84rem" }}>
                  <Sparkles size={15} />
                  Auslosung wird vorbereitet
                </span>
              )}
            </div>
          )}

          {/* Editorial 2-Step Ledger Index */}
          <div
            style={{
              borderTop: "1px solid var(--border-hairline)",
              paddingTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
              <span
                className="font-mono-code"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: selectedId ? "var(--status-ok-ink)" : "var(--accent)",
                }}
              >
                01
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--ink-primary)" }}>
                  Namen auswählen
                </div>
                <div style={{ fontSize: "0.84rem", color: "var(--ink-muted)" }}>
                  {selectedParticipant
                    ? `Ausgewählt: ${selectedParticipant.name} (${selectedParticipant.subgroup.name})`
                    : `${participants.length} Teilnehmer in dieser Runde`}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
              <span
                className="font-mono-code"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: revealData ? "var(--status-ok-ink)" : "var(--ink-muted)",
                }}
              >
                02
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--ink-primary)" }}>
                  {hasDirectPin ? "Direkt-Enthüllung" : "4-stellige PIN eingeben"}
                </div>
                <div style={{ fontSize: "0.84rem", color: "var(--ink-muted)" }}>
                  Zuteilung innerhalb der eigenen Gruppe ist ausgeschlossen
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Columns 6–12: Interactive Card */}
        <section
          className="portal-col-right stagger-in"
          style={{ ["--stagger-index" as string]: 2 }}
        >
          {revealData ? (
            <RevealCard
              giverName={revealData.giverName}
              receiver={revealData.receiver}
              eventDetails={revealData.eventDetails}
              onClose={handleCloseReveal}
            />
          ) : (
            <div
              className="editorial-card-strong"
              style={{
                overflow: "hidden",
                textAlign: "left",
              }}
            >
              {/* Crimson & Brass Gift-Wrap Card Header */}
              <div
                style={{
                  background: "var(--bg-surface-muted)",
                  borderBottom: "2px solid var(--brass)",
                  padding: "12px clamp(24px, 4vw, 36px)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span className="eyebrow" style={{ color: "var(--ink-primary)" }}>
                  Wichtel-Umschlag öffnen
                </span>
                <HollySprig size={22} />
              </div>

              <div style={{ padding: "clamp(24px, 4vw, 36px)" }}>
              {errorMessage && (
                <div
                  style={{
                    background: "var(--status-err-bg)",
                    border: "1px solid var(--status-err-border)",
                    color: "var(--status-err-ink)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginBottom: "20px",
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Participant Selection */}
              <div style={{ marginBottom: selectedId ? "26px" : "0" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <label
                    htmlFor="participant-select"
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      color: "var(--ink-secondary)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {hasDirectPin ? "Teilnehmer" : "1. Wer bist du?"}
                  </label>
                  {selectedId && (
                    <button
                      type="button"
                      onClick={handleResetSelection}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--accent)",
                        fontSize: "0.82rem",
                        fontWeight: 600,
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
                      background: "var(--bg-paper)",
                      border: "1px solid var(--border-hairline)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontWeight: 700,
                      fontSize: "1.05rem",
                      color: "var(--ink-primary)",
                    }}
                  >
                    <span>{selectedParticipant.name}</span>
                    <span className="badge">{selectedParticipant.subgroup.name}</span>
                  </div>
                ) : (
                  <select
                    id="participant-select"
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

              {/* Step 2: Direct Link Reveal OR PIN Pad */}
              {selectedId && hasDirectPin ? (
                <div
                  style={{
                    borderTop: "1px solid var(--border-hairline)",
                    paddingTop: "22px",
                  }}
                >
                  <div
                    style={{
                      background: "var(--bg-paper)",
                      border: "1px solid var(--border-hairline)",
                      borderRadius: "12px",
                      padding: "16px 18px",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "var(--ink-primary)",
                        marginBottom: "4px",
                      }}
                    >
                      Hallo {selectedParticipant?.name}!
                    </div>
                    <div style={{ fontSize: "0.88rem", color: "var(--ink-secondary)" }}>
                      Dein persönlicher Link ist bestätigt – keine PIN-Eingabe nötig.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePinSubmit(pin)}
                    disabled={submitting}
                    className="btn-festive-red"
                    style={{ width: "100%", padding: "15px", fontSize: "1rem" }}
                  >
                    {submitting ? (
                      "Wichtel-Los wird geöffnet..."
                    ) : (
                      <>
                        Wichtelkind jetzt enthüllen
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              ) : selectedId ? (
                <div
                  style={{
                    borderTop: "1px solid var(--border-hairline)",
                    paddingTop: "22px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--ink-secondary)",
                      marginBottom: "16px",
                    }}
                  >
                    <Lock size={14} />
                    2. Deine 4-stellige Wichtel-PIN
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
                        textAlign: "center",
                        color: "var(--ink-secondary)",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                      }}
                    >
                      Wichtel-Los wird geöffnet...
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "18px",
                    borderTop: "1px solid var(--border-hairline)",
                    fontSize: "0.86rem",
                    color: "var(--ink-muted)",
                  }}
                >
                  Sobald du deinen Namen auswählst, erscheint hier das Eingabefeld für deine PIN.
                </div>
              )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer
        className="stagger-in"
        style={{
          ["--stagger-index" as string]: 3,
          marginTop: "56px",
          paddingTop: "18px",
          borderTop: "1px solid var(--border-hairline)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          color: "var(--ink-muted)",
          fontSize: "0.82rem",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <NorthStarIcon size={12} color="#B58428" />
          {pageTitle} · Frohe Weihnachten
        </span>
        <span className="font-mono-code">wichteln.felixresch.com</span>
      </footer>
    </main>
  );
}
