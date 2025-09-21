/**
 * Mapping utilities for Article data between camelCase (TypeScript) and snake_case (Supabase)
 */

import type { Article, InsertArticle } from '@shared/schema';

// Convert camelCase Article to snake_case for Supabase
export function toSupabaseArticle(article: Partial<InsertArticle>): any {
  const mapped: any = {};
  
  // Direct mapping (same name)
  if (article.title !== undefined) mapped.title = article.title;
  if (article.slug !== undefined) mapped.slug = article.slug;
  if (article.content !== undefined) mapped.content = article.content;
  if (article.status !== undefined) mapped.status = article.status;
  if (article.category !== undefined) mapped.category = article.category;
  if (article.keywords !== undefined) mapped.keywords = article.keywords;
  if (article.summary !== undefined) mapped.excerpt = article.summary; // Map summary -> excerpt
  
  // Snake case mapping
  if (article.metaDescription !== undefined) mapped.meta_description = article.metaDescription;
  if (article.seoTitle !== undefined) mapped.seo_title = article.seoTitle;
  if (article.authorName !== undefined) mapped.author_name = article.authorName;
  if (article.publishedAt !== undefined) mapped.published_at = article.publishedAt;
  if (article.scheduledFor !== undefined) mapped.scheduled_for = article.scheduledFor;
  
  return mapped;
}

// Convert snake_case Supabase result to camelCase Article
export function fromSupabaseArticle(supabaseData: any): Article {
  return {
    id: supabaseData.id,
    title: supabaseData.title,
    slug: supabaseData.slug,
    metaDescription: supabaseData.meta_description,
    content: supabaseData.content,
    summary: supabaseData.excerpt, // Map excerpt -> summary
    keywords: supabaseData.keywords,
    seoTitle: supabaseData.seo_title,
    authorName: supabaseData.author_name || 'Expert Immobilier',
    status: supabaseData.status,
    category: supabaseData.category,
    publishedAt: supabaseData.published_at ? new Date(supabaseData.published_at) : new Date(),
    scheduledFor: supabaseData.scheduled_for ? new Date(supabaseData.scheduled_for) : undefined,
    updatedAt: supabaseData.updated_at ? new Date(supabaseData.updated_at) : new Date(),
    createdAt: supabaseData.created_at ? new Date(supabaseData.created_at) : new Date(),
  };
}

// Convert array of Supabase results
export function fromSupabaseArticles(supabaseData: any[]): Article[] {
  return supabaseData.map(fromSupabaseArticle);
}