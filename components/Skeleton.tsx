import type { CSSProperties } from "react";
import { card } from "@/components/ui";

// Building blocks for instant loading states. Each tab's loading.tsx composes
// these so a tab switch shows structure immediately instead of a frozen screen.

export function SkeletonBox({ style }: { style?: CSSProperties }) {
  return <div className="skeleton" style={style} />;
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div style={{ ...card, padding: 18, display: "flex", flexDirection: "column", gap: 11 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          style={{ height: 13, width: i === 0 ? "45%" : "80%" }}
        />
      ))}
    </div>
  );
}

const PAGE: CSSProperties = {
  padding: "60px 18px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

export function HomeSkeleton() {
  return (
    <div style={PAGE}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SkeletonBox style={{ width: 44, height: 44, borderRadius: 999 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          <SkeletonBox style={{ height: 14, width: "40%" }} />
          <SkeletonBox style={{ height: 11, width: "55%" }} />
        </div>
      </div>
      <div style={{ ...card, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <SkeletonBox style={{ height: 12, width: "35%" }} />
        <SkeletonBox style={{ height: 40, width: "30%" }} />
        <SkeletonBox style={{ height: 40, width: "100%" }} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ ...card, flex: 1, padding: 15, display: "flex", flexDirection: "column", gap: 8 }}>
            <SkeletonBox style={{ height: 24, width: "50%" }} />
            <SkeletonBox style={{ height: 11, width: "80%" }} />
          </div>
        ))}
      </div>
      <SkeletonCard lines={3} />
    </div>
  );
}

export function ListSkeleton({ title = true, rows = 5 }: { title?: boolean; rows?: number }) {
  return (
    <div style={PAGE}>
      {title && <SkeletonBox style={{ height: 28, width: "40%" }} />}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderBottom: i < rows - 1 ? "1px solid rgba(20,23,26,.06)" : "none",
            }}
          >
            <SkeletonBox style={{ width: 38, height: 38, borderRadius: 11 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
              <SkeletonBox style={{ height: 13, width: "55%" }} />
              <SkeletonBox style={{ height: 10, width: "35%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={PAGE}>
      <SkeletonBox style={{ height: 28, width: "40%" }} />
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={3} />
      ))}
    </div>
  );
}
