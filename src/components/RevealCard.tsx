"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Gift, Calendar, DollarSign, ShieldAlert, ArrowLeft, Sparkles } from "lucide-react";

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
    // Festive multi-angle confetti explosion
    const end = Date.now() + 1200;
    const colors = ["#fbbf24", "#e11d48", "#10b981", "#ffffff"];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
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
      className="glass-panel"
      style={{
        width: "100%",
        maxWidth: "520px",
        margin: "0 auto",
        padding: "36px 28px",
        textAlign: "center",
        border: "1px solid rgba(251, 191, 36, 0.4)",
        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(251, 191, 36, 0.2)",
        position: "relative",
        animation: "cardPop 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Decorative Golden Ribbon / Sparkle Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(251, 191, 36, 0.15)",
          color: "#fbbf24",
          border: "1px solid rgba(251, 191, 36, 0.3)",
          borderRadius: "9999px",
          padding: "6px 16px",
          fontSize: "0.85rem",
          fontWeight: "600",
          marginBottom: "20px",
        }}
      >
        <Sparkles size={16} />
        Hallo {giverName}, dein Wichtel-Los ist bereit!
      </div>

      {/* Floating Gift Icon */}
      <div
        style={{
          width: "90px",
          height: "90px",
          margin: "0 auto 20px",
          borderRadius: "24px",
          background: "linear-gradient(135deg, rgba(225, 29, 72, 0.8) 0%, rgba(190, 18, 60, 0.9) 100%)",
          border: "2px solid rgba(251, 191, 36, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          boxShadow: "0 10px 30px rgba(225, 29, 72, 0.5), 0 0 25px rgba(251, 191, 36, 0.4)",
        }}
        className="festive-glow float-animation"
      >
        <Gift size={46} strokeWidth={2.2} />
      </div>

      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "1.05rem",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          marginBottom: "8px",
          fontWeight: "500",
        }}
      >
        Du beschenkst dieses Jahr:
      </p>

      {/* Recipient Name in Festive Typography */}
      <h2
        className="font-festive"
        style={{
          fontSize: "2.6rem",
          fontWeight: "800",
          color: "#fff",
          lineHeight: "1.2",
          marginBottom: "12px",
          textShadow: "0 0 25px rgba(251, 191, 36, 0.4)",
        }}
      >
        {receiver.name}
      </h2>

      {/* Subgroup Badge */}
      <div style={{ marginBottom: "28px" }}>
        <span
          className="badge"
          style={{
            background: receiver.subgroupColor
              ? `${receiver.subgroupColor}25`
              : "rgba(16, 185, 129, 0.15)",
            color: receiver.subgroupColor || "#34d399",
            border: `1px solid ${
              receiver.subgroupColor
                ? `${receiver.subgroupColor}50`
                : "rgba(16, 185, 129, 0.3)"
            }`,
            fontSize: "0.95rem",
            padding: "6px 16px",
          }}
        >
          Aus der Gruppe: <strong>{receiver.subgroup}</strong>
        </span>
      </div>

      {/* Event Details Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "24px",
          textAlign: "left",
        }}
      >
        {/* Budget */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#fbbf24",
              fontSize: "0.85rem",
              fontWeight: "600",
              marginBottom: "4px",
            }}
          >
            <DollarSign size={15} />
            Budgetrichtwert
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#fff" }}>
            {eventDetails.budget}
          </div>
        </div>

        {/* Date */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#34d399",
              fontSize: "0.85rem",
              fontWeight: "600",
              marginBottom: "4px",
            }}
          >
            <Calendar size={15} />
            Bescherung
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "#fff" }}>
            {eventDetails.eventDate}
          </div>
        </div>
      </div>

      {/* Secret Reminder Alert */}
      <div
        style={{
          background: "rgba(225, 29, 72, 0.12)",
          border: "1px solid rgba(225, 29, 72, 0.3)",
          borderRadius: "14px",
          padding: "14px 16px",
          marginBottom: "28px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          textAlign: "left",
        }}
      >
        <ShieldAlert size={22} color="#fb7185" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <div style={{ fontWeight: "700", color: "#fda4af", fontSize: "0.95rem" }}>
            Strengste Geheimhaltung! 🤫
          </div>
          <div style={{ color: "#fecdd3", fontSize: "0.85rem", marginTop: "2px", lineHeight: "1.4" }}>
            {eventDetails.notes}
          </div>
        </div>
      </div>

      {/* Close Button to return & hide */}
      <button
        type="button"
        onClick={onClose}
        className="btn-festive-outline"
        style={{ width: "100%", padding: "14px 20px" }}
      >
        <ArrowLeft size={18} />
        Ergebnis schließen (vor neugierigen Blicken schützen)
      </button>

      <style jsx>{`
        @keyframes cardPop {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
