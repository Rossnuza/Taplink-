// Domain types for TapLink. These mirror the database schema in
// supabase/migrations and are the single source of truth used across the app.

export type BlockType =
  | "linkedin"
  | "contact"
  | "website"
  | "document"
  | "calendar"
  | "custom";

export type EventType =
  | "scan" // public page load
  | "link_click" // a non-document block was tapped
  | "doc_open" // visitor chose "view in browser"
  | "doc_email" // visitor asked us to email the document
  | "contact_save"; // vCard downloaded

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  brand_color: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  contact_email: string | null;
  phone: string | null;
  company: string | null;
  is_live: boolean;
  created_at: string;
  updated_at: string;
}

export interface LinkBlock {
  id: string;
  profile_id: string;
  type: BlockType;
  label: string;
  url: string | null;
  asset_id: string | null;
  position: number;
  enabled: boolean;
  created_at: string;
}

export interface Asset {
  id: string;
  profile_id: string;
  title: string;
  storage_path: string;
  file_size: number;
  version: number;
  require_email: boolean;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  profile_id: string;
  email: string;
  asset_id: string | null;
  source: string | null;
  country: string | null;
  device: string | null;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  profile_id: string;
  type: EventType;
  block_id: string | null;
  asset_id: string | null;
  source: string | null;
  device: string | null;
  browser: string | null;
  country: string | null;
  created_at: string;
}

// Default theme used when no logo/brand colour has been set.
export const DEFAULT_BRAND_COLOR = "#0c5c54";
