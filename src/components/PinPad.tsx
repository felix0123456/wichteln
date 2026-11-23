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
        maxWidth: "312px",
        margin: "0 auto",
      }}
    >
      {/* 4-dot PIN Indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          marginBottom: "22px",
        }}
      >
        {[0, 1, 2, 3].map((index) => {
          const filled = index < pin.length;
          return (
            <div
              key={index}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                border: isError
                  ? "2px solid var(--status-err-ink)"
                  : filled
                  ? "2px solid var(--ink-primary)"
                  : "2px solid var(--border-hairline)",
                background: isError
                  ? "var(--status-err-bg)"
                  : filled
                  ? "var(--ink-primary)"
                  : "var(--bg-paper)",
                transform: filled ? "scale(1.12)" : "scale(1)",
                transition: "transform 160ms var(--ease-editorial), background-color 160ms var(--ease-editorial)",
              }}
            />
          );
        })}
      </div>

      {/* Tactile Keypad */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          width: "100%",
        }}
      >
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            disabled={disabled}
            className="font-mono-code"
            style={{
              height: "58px",
              fontSize: "1.35rem",
              fontWeight: 600,
              color: "var(--ink-primary)",
              background: "var(--bg-paper)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "10px",
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "background-color 140ms var(--ease-editorial), border-color 140ms var(--ease-editorial)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
            height: "58px",
            color: "var(--ink-secondary)",
            background: "var(--bg-surface-muted)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "10px",
            cursor: disabled || pin.length === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: pin.length === 0 ? 0.35 : 1,
            transition: "opacity 140ms var(--ease-editorial)",
          }}
        >
          <RotateCcw size={20} />
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          disabled={disabled}
          className="font-mono-code"
          style={{
            height: "58px",
            fontSize: "1.35rem",
            fontWeight: 600,
            color: "var(--ink-primary)",
            background: "var(--bg-paper)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "10px",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
            height: "58px",
            color: "var(--status-err-ink)",
            background: "var(--status-err-bg)",
            border: "1px solid var(--status-err-border)",
            borderRadius: "10px",
            cursor: disabled || pin.length === 0 ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: pin.length === 0 ? 0.35 : 1,
            transition: "opacity 140ms var(--ease-editorial)",
          }}
        >
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
}
