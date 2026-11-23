"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Gift, Calendar, DollarSign, ShieldAlert, ArrowLeft } from "lucide-react";

interface RevealCardProps {
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
  onClose: () => void;
}

export default function RevealCard({
  giverName,
  receiver,
  eventDetails,
  onClose,
}: RevealCardProps) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const end = Date.now() + 900;
    const colors = ["#B8332A", "#17231C", "#D8D0C0", "#1E563B"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 50,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 50,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div
      className="editorial-card-strong stagger-in"
      style={{
        padding: "clamp(24px, 4vw, 38px)",
        textAlign: "left",
        borderTop: "6px solid var(--accent)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          paddingBottom: "18px",
          marginBottom: "24px",
          borderBottom: "1px solid var(--border-hairline)",
        }}
      >
        <span className="eyebrow">Wichtel-Los · {giverName}</span>
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
          <Gift size={18} />
        </span>
      </div>

      <p
        style={{
          color: "var(--ink-secondary)",
          fontSize: "0.9rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        Du beschenkst dieses Jahr
      </p>

      <h2
        className="font-festive"
        style={{
          fontSize: "clamp(2.4rem, 5vw, 3.4rem)",
          fontWeight: 700,
          color: "var(--ink-primary)",
          lineHeight: 1.06,
          letterSpacing: "-0.025em",
          marginBottom: "14px",
        }}
      >
        {receiver.name}
      </h2>

      <div style={{ marginBottom: "28px" }}>
        <span className="badge badge-green" style={{ fontSize: "0.86rem", padding: "5px 14px" }}>
          Gruppe: <strong>{receiver.subgroup}</strong>
        </span>
      </div>

      {/* Event Details */}
      <div className="reveal-meta-grid" style={{ marginBottom: "20px" }}>
        <div
          style={{
            background: "var(--bg-paper)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "12px",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--ink-muted)",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            <DollarSign size={14} />
            Budgetrichtwert
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink-primary)" }}>
            {eventDetails.budget}
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-paper)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "12px",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--ink-muted)",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            <Calendar size={14} />
            Bescherung
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--ink-primary)" }}>
            {eventDetails.eventDate}
          </div>
        </div>
      </div>

      {/* Secret Reminder */}
      <div
        style={{
          background: "var(--status-err-bg)",
          border: "1px solid var(--status-err-border)",
          borderRadius: "12px",
          padding: "14px 16px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <ShieldAlert size={20} color="var(--status-err-ink)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <div style={{ fontWeight: 700, color: "var(--status-err-ink)", fontSize: "0.9rem" }}>
            Strengste Geheimhaltung
          </div>
          <div
            style={{
              color: "var(--ink-primary)",
              fontSize: "0.88rem",
              marginTop: "2px",
              lineHeight: 1.45,
            }}
          >
            {eventDetails.notes}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="btn-festive-outline"
        style={{ width: "100%", padding: "13px 18px" }}
      >
        <ArrowLeft size={16} />
        Ergebnis schließen (vor Blicken schützen)
      </button>
    </div>
  );
}
