"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon, exact: true },
  { href: "/dashboard/analytics", label: "Stats", icon: StatsIcon },
  { href: "/dashboard/profile", label: "Profile", icon: ProfileIcon },
  { href: "/dashboard/assets", label: "Assets", icon: AssetsIcon },
  { href: "/dashboard/share", label: "Share", icon: ShareIcon },
  { href: "/dashboard/leads", label: "Leads", icon: LeadsIcon },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        display: "flex",
        alignItems: "flex-start",
        padding: "12px 6px max(16px, env(safe-area-inset-bottom))",
        background: "#fff",
        borderTop: "1px solid rgba(20,23,26,.08)",
        boxShadow: "0 -4px 16px rgba(20,23,26,.04)",
      }}
    >
      {TABS.map((t) => {
        const active = t.exact
          ? pathname === t.href
          : pathname.startsWith(t.href);
        const color = active ? "#0c5c54" : "#9aa0a8";
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              color,
            }}
          >
            <Icon />
            <span style={{ fontSize: 10.5, fontWeight: 700 }}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const sized = {
  width: 23,
  height: 23,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function HomeIcon() {
  return (
    <svg {...sized}>
      <path d="M4 13h5v7H4zM10 8h5v12h-5zM16 4h4v16h-4z" />
    </svg>
  );
}
function StatsIcon() {
  return (
    <svg {...sized}>
      <path d="M4 19V5M4 19h16M8 19v-6M12 19V9M16 19v-9" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg {...sized}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  );
}
function AssetsIcon() {
  return (
    <svg {...sized}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg {...sized}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 21v.01M21 14v.01M14 21v.01" />
    </svg>
  );
}
function LeadsIcon() {
  return (
    <svg {...sized}>
      <path d="M4 5h16v14H4z" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}
