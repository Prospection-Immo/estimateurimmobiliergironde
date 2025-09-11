import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ArticleGenerationRequest {
  title: string;
  topic: string;
  keywords: string[];
  targetRegion?: string;
  tone?: 'professional' | 'informative' | 'engaging';
  length?: 'short' | 'medium' | 'long';
}

export interface GeneratedArticle {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  summary: string;
  keywords: string[];
  seoElements: {
    title: string;
    description: string;
    slug: string;
  };
}

/**
 * Generate a real estate article using OpenAI GPT-5
 */
export async function generateRealEstateArticle(request: ArticleGenerationRequest): Promise<GeneratedArticle> {
  const { title, topic, keywords, targetRegion = 'Gironde', tone = 'professional', length = 'medium' } = request;

  const lengthGuide = {
    short: '400-600 mots',
    medium: '600-800 mots', 
    long: '800-1000 mots'
  };

  const prompt = `Tu es un expert en rédaction immobilière française spécialisé dans la région ${targetRegion}. 

Génère un article complet sur le sujet suivant :
- Titre principal : ${title}
- Sujet : ${topic}
- Mots-clés à intégrer : ${keywords.join(', ')}
- Longueur : ${lengthGuide[length]}
- Ton : ${tone}

L'article doit respecter ces critères :
1. Être informatif et utile pour les propriétaires et investisseurs
2. Inclure des conseils pratiques et des exemples concrets
3. Mentionner des références crédibles (notaires, agents immobiliers, lois françaises)
4. Être optimisé SEO avec une structure claire (H1, H2, H3)
5. Inclure des données chiffrées réalistes pour ${targetRegion}
6. Avoir un ton professionnel mais accessible

⚠️ OBLIGATION: Toujours inclure TOUS les champs: title, slug, metaDescription, content, summary, keywords, seoElements. Si la limite de tokens empêche un contenu long, produis un content HTML concis mais n'omets JAMAIS de champs.

Structure demandée :
- Introduction accrocheuse
- 3-4 sections principales avec sous-titres
- Conseils pratiques avec bullet points
- Conclusion avec call-to-action
- Pas d'images (texte uniquement)

Réponds en JSON avec cette structure exacte :
{
  "title": "titre optimisé SEO",
  "slug": "url-friendly-slug",
  "metaDescription": "description de 150-160 caractères",
  "content": "contenu HTML complet avec balises h2, h3, p, ul, li",
  "summary": "résumé de 2-3 phrases",
  "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"],
  "seoElements": {
    "title": "titre SEO",
    "description": "meta description",
    "slug": "slug-url"
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en rédaction immobilière française. Tu génères du contenu de haute qualité, factuel et optimisé SEO. Réponds toujours en JSON valide."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 1
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Lightweight debug logging
    console.log('OpenAI Response Keys:', Object.keys(result));
    console.log('Content length:', result.content?.length || 0);
    console.log('Usage:', response.usage);
    
    // Add fallback for missing slug
    if (!result.slug && !result.seoElements?.slug && result.title) {
      const slugified = result.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      result.slug = slugified;
    }
    
    // Validate required fields
    if (!result.title || !result.content || (!result.slug && !result.seoElements?.slug)) {
      throw new Error(`Generated article missing required fields. Found: title=${!!result.title}, content=${!!result.content}, slug=${!!result.slug}, seoElements.slug=${!!result.seoElements?.slug}`);
    }

    return {
      title: result.title,
      slug: result.slug || result.seoElements?.slug || '',
      metaDescription: result.metaDescription || result.seoElements?.description || '',
      content: result.content,
      summary: result.summary || '',
      keywords: result.keywords || keywords,
      seoElements: result.seoElements || {
        title: result.title,
        description: result.metaDescription || result.seoElements?.description,
        slug: result.slug || result.seoElements?.slug
      }
    };

  } catch (error) {
    console.error('Error generating article with OpenAI:', error);
    throw new Error(`Failed to generate article: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate market insights for a specific property type and region
 */
export async function generateMarketInsights(propertyType: string, region: string): Promise<{
  insights: string;
  trends: string[];
  recommendations: string[];
}> {
  const prompt = `En tant qu'expert du marché immobilier français, génère une analyse de marché pour :
- Type de bien : ${propertyType}
- Région : ${region}

Fournis une analyse courte mais précise incluant :
1. État actuel du marché
2. Tendances principales (3-4 points)
3. Recommandations pour acheteurs/vendeurs (3 points)

Utilise des données réalistes et crédibles. Réponds en JSON :
{
  "insights": "analyse générale en 2-3 paragraphes",
  "trends": ["tendance 1", "tendance 2", "tendance 3"],
  "recommendations": ["conseil 1", "conseil 2", "conseil 3"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system", 
          content: "Tu es un expert du marché immobilier français. Tes analyses sont factuelles, professionnelles et basées sur des tendances réalistes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 1
    });

    return JSON.parse(response.choices[0].message.content || '{}');

  } catch (error) {
    console.error('Error generating market insights:', error);
    throw new Error(`Failed to generate market insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}