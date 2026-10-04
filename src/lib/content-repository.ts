import "server-only";
import { content as fallbackContent } from "./content";
import type { ContentItem } from "./types";
import { createClient } from "./supabase/server";

function fromRow(row: Record<string, unknown>): ContentItem {
  return {
    slug: String(row.slug), kind: row.kind as ContentItem["kind"],
    title: { en:String(row.title_en), ml:String(row.title_ml) },
    summary: { en:String(row.summary_en), ml:String(row.summary_ml) },
    body: { en:String(row.body_en), ml:String(row.body_ml) },
    category: { en:String(row.category_en), ml:String(row.category_ml) },
    audience: row.audience as ContentItem["audience"], date: row.event_date ? String(row.event_date) : undefined,
    location: row.location_en && row.location_ml ? {en:String(row.location_en),ml:String(row.location_ml)} : undefined,
    featured: Boolean(row.featured), launchApproved: row.status === "published",
  };
}

export async function getPublishedContent(): Promise<ContentItem[]> {
  const client = await createClient();
  if (!client) return fallbackContent.filter(item => !item.summary.en.toLowerCase().includes("sample"));
  const {data,error} = await client.from("content_items").select("*").eq("status","published").order("display_order");
  if (error) { console.error("Public content query failed", error.message); return []; }
  return (data ?? []).map(row => fromRow(row as unknown as Record<string,unknown>));
}

export async function getPublishedContentBySlug(slug:string) {
  const items = await getPublishedContent();
  return items.find(item => item.slug === slug);
}
