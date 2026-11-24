import React from "react";

export function PineStarMark({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      {/* Brass North Star */}
      <path
        d="M24 3L25.9 8.1L31 10L25.9 11.9L24 17L22.1 11.9L17 10L22.1 8.1L24 3Z"
        fill="#B58428"
      />
      {/* Upper Pine Tier */}
      <path d="M24 15L34 27H14L24 15Z" fill="#123524" />
      {/* Lower Pine Tier */}
      <path d="M24 22L38 37H10L24 22Z" fill="#18442F" />
      {/* Ornaments (Cranberry & Brass) */}
      <circle cx="21" cy="24" r="1.8" fill="#B4231E" />
      <circle cx="28" cy="30" r="2" fill="#B4231E" />
      <circle cx="19" cy="33" r="1.7" fill="#FBF6EC" />
      <circle cx="26" cy="24" r="1.4" fill="#B58428" />
      {/* Trunk */}
      <rect x="21.5" y="37" width="5" height="6" rx="1" fill="#6D4C2F" />
    </svg>
  );
}

export function HollySprig({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size * 1.4}
      height={size}
      viewBox="0 0 42 30"
      fill="none"
      aria-hidden="true"
    >
      {/* Left Holly Leaf */}
      <path
        d="M20 17C14 10 6 10 3 15C6 18 7 22 4 25C10 26 16 23 20 17Z"
        fill="#123524"
      />
      {/* Right Holly Leaf */}
      <path
        d="M22 17C28 10 36 10 39 15C36 18 35 22 38 25C32 26 26 23 22 17Z"
        fill="#1B4D35"
      />
      {/* Berries */}
      <circle cx="21" cy="14" r="3.2" fill="#B4231E" />
      <circle cx="17.5" cy="18.5" r="2.9" fill="#961B17" />
      <circle cx="24.5" cy="18.5" r="2.9" fill="#B4231E" />
      {/* Tiny highlights */}
      <circle cx="20.1" cy="13" r="0.8" fill="#FBF6EC" />
      <circle cx="23.8" cy="17.6" r="0.7" fill="#FBF6EC" />
    </svg>
  );
}

export function NorthStarIcon({ size = 14, color = "#B58428" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
        fill={color}
      />
    </svg>
  );
}
