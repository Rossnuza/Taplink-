"use client";

export default function Switch({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="switch"
      aria-checked={on}
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        background: on ? "#0c5c54" : "#d5d8dd",
        position: "relative",
        cursor: disabled ? "default" : "pointer",
        transition: "background .18s ease",
        flexShrink: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.25)",
          transition: "left .18s ease",
        }}
      />
    </div>
  );
}
