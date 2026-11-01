"use client";

import React, { useEffect, useCallback } from "react";
import { Delete, RotateCcw } from "lucide-react";

interface PinPadProps {
  pin: string;
  onPinChange: (newPin: string) => void;
  onSubmit: (pin: string) => void;
  disabled?: boolean;
  isError?: boolean;
}

export default function PinPad({
  pin,
  onPinChange,
  onSubmit,
  disabled = false,
  isError = false,
}: PinPadProps) {
  const handleDigit = useCallback(
    (digit: string) => {
      if (disabled) return;
      if (pin.length < 4) {
        const nextPin = pin + digit;
        onPinChange(nextPin);
        if (nextPin.length === 4) {
          onSubmit(nextPin);
        }
      }
    },
    [pin, disabled, onPinChange, onSubmit]
  );

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    if (pin.length > 0) {
      onPinChange(pin.slice(0, -1));
    }
  }, [pin, disabled, onPinChange]);

  const handleClear = useCallback(() => {
    if (disabled) return;
    onPinChange("");
  }, [disabled, onPinChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, handleDigit, handleBackspace, handleClear]);

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: "320px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "18px",
          marginBottom: "28px",
        }}
      >
        {[0, 1, 2, 3].map((index) => {
          const filled = index < pin.length;
          return (
            <div
              key={index}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: isError
                  ? "2px solid #ef4444"
                  : filled
                  ? "2px solid #fbbf24"
                  : "2px solid rgba(255, 255, 255, 0.2)",
                background: isError
                  ? "rgba(239, 68, 68, 0.4)"
                  : filled
                  ? "radial-gradient(circle, #fbbf24 30%, #f59e0b 100%)"
                  : "rgba(255, 255, 255, 0.05)",
                boxShadow: filled && !isError ? "0 0 14px rgba(251, 191, 36, 0.6)" : "none",
                transform: filled ? "scale(1.15)" : "scale(1)",
                transition: "all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          width: "100%",
        }}
      >
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            disabled={disabled}
            style={{
              height: "64px",
              fontSize: "1.6rem",
              fontWeight: "600",
              color: "#ffffff",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
            }}
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || pin.length === 0}
          title="Zurücksetzen"
          style={{
            height: "64px",
            color: "#94a3b8",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            cursor: disabled || pin.length === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: pin.length === 0 ? 0.3 : 1,
            transition: "all 0.15s ease",
          }}
        >
          <RotateCcw size={22} />
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          disabled={disabled}
          style={{
            height: "64px",
            fontSize: "1.6rem",
            fontWeight: "600",
            color: "#ffffff",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          disabled={disabled || pin.length === 0}
          title="Löschen"
          style={{
            height: "64px",
            color: "#fb7185",
            background: "rgba(225, 29, 72, 0.08)",
            border: "1px solid rgba(225, 29, 72, 0.15)",
            borderRadius: "16px",
            cursor: disabled || pin.length === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: pin.length === 0 ? 0.3 : 1,
            transition: "all 0.15s ease",
          }}
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  );
}
