"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Gift, Calendar, DollarSign, ShieldAlert, ArrowLeft } from "lucide-react";
import { HollySprig, NorthStarIcon } from "@/components/ChristmasMotifs";

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

    const end = Date.now() + 1000;
    const colors = ["#B4231E", "#123524", "#B58428", "#FBF6EC"];

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
        overflow: "hidden",
        textAlign: "left",
        border: "1.5px solid var(--border-strong)",
      }}
    >
      {/* Evergreen Christmas Ticket Header */}
      <div
        style={{
          background: "var(--bg-pine)",
          color: "var(--ink-on-pine)",
          padding: "16px clamp(20px, 4vw, 34px)",
          borderBottom: "3px solid var(--brass)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <NorthStarIcon size={16} color="#B58428" />
          <span className="eyebrow" style={{ color: "var(--ink-on-pine)" }}>
            Weihnachtliches Wichtel-Los · {giverName}
          </span>
        </div>
        <span
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "8px",
            background: "var(--accent)",
            color: "var(--accent-ink)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--brass)",
          }}
        >
          <Gift size={17} />
        </span>
      </div>

      <div style={{ padding: "clamp(24px, 4vw, 36px)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "10px",
          }}
        >
          <p
            style={{
              color: "var(--ink-secondary)",
              fontSize: "0.86rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Du beschenkst dieses Weihnachten
          </p>
          <HollySprig size={24} />
        </div>

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
    </div>
  );
}
