/**
 * Mapping utilities for Guide data between camelCase (TypeScript) and snake_case (Supabase)
 */

import type { Guide, InsertGuide } from '@shared/schema';

// Convert camelCase Guide to snake_case for Supabase
export function toSupabaseGuide(guide: Partial<InsertGuide>): any {
  const mapped: any = {};
  
  // Direct mapping (same name)
  if (guide.title !== undefined) mapped.title = guide.title;
  if (guide.slug !== undefined) mapped.slug = guide.slug;
  if (guide.persona !== undefined) mapped.persona = guide.persona;
  if (guide.content !== undefined) mapped.content = guide.content;
  if (guide.summary !== undefined) mapped.summary = guide.summary;
  if (guide.status !== undefined) mapped.status = guide.status;
  
  // Snake case mapping
  if (guide.shortBenefit !== undefined) mapped.short_benefit = guide.shortBenefit;
  if (guide.readingTime !== undefined) mapped.reading_time = guide.readingTime;
  if (guide.pdfContent !== undefined) mapped.pdf_content = guide.pdfContent;
  if (guide.imageUrl !== undefined) mapped.image_url = guide.imageUrl;
  if (guide.metaDescription !== undefined) mapped.meta_description = guide.metaDescription;
  if (guide.seoTitle !== undefined) mapped.seo_title = guide.seoTitle;
  if (guide.isActive !== undefined) mapped.is_active = guide.isActive;
  if (guide.sortOrder !== undefined) mapped.sort_order = guide.sortOrder;
  
  return mapped;
}

// Convert snake_case Supabase result to camelCase Guide
export function fromSupabaseGuide(supabaseData: any): Guide {
  return {
    id: supabaseData.id,
    title: supabaseData.title,
    slug: supabaseData.slug,
    persona: supabaseData.persona,
    shortBenefit: supabaseData.short_benefit,
    readingTime: supabaseData.reading_time,
    content: supabaseData.content,
    summary: supabaseData.summary,
    pdfContent: supabaseData.pdf_content,
    imageUrl: supabaseData.image_url,
    metaDescription: supabaseData.meta_description,
    seoTitle: supabaseData.seo_title,
    isActive: supabaseData.is_active ?? true,
    sortOrder: supabaseData.sort_order ?? 0,
    createdAt: supabaseData.created_at ? new Date(supabaseData.created_at) : new Date(),
    updatedAt: supabaseData.updated_at ? new Date(supabaseData.updated_at) : new Date(),
  };
}

// Convert array of Supabase results
export function fromSupabaseGuides(supabaseData: any[]): Guide[] {
  return supabaseData.map(fromSupabaseGuide);
}