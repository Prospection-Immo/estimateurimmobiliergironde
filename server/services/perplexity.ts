export interface PerplexityRequest {
  query: string;
  region?: string;
  searchRecency?: 'hour' | 'day' | 'week' | 'month' | 'year';
  maxTokens?: number;
}

export interface PerplexityResponse {
  content: string;
  citations: string[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call Perplexity API for real-time market research
 */
export async function getMarketResearch(request: PerplexityRequest): Promise<PerplexityResponse> {
  const { query, region = 'Gironde', searchRecency = 'month', maxTokens = 1000 } = request;

  const enhancedQuery = region ? `${query} en ${region}, France` : query;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en immobilier français. Fournis des informations factuelles et récentes sur le marché immobilier, les prix, les tendances et la réglementation. Réponds en français."
          },
          {
            role: "user",
            content: enhancedQuery
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.2,
        top_p: 0.9,
        search_recency_filter: searchRecency,
        return_images: false,
        return_related_questions: false,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      citations: data.citations || [],
      model: data.model,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };

  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw new Error(`Failed to get market research: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get current real estate prices for a specific area
 */
export async function getCurrentPrices(propertyType: string, city: string): Promise<{
  averagePrice: string;
  priceRange: string;
  marketTrend: string;
  sources: string[];
}> {
  const query = `Prix immobilier ${propertyType} ${city} 2025 prix au m2 tendances marché`;

  try {
    const response = await getMarketResearch({
      query,
      region: 'Gironde',
      searchRecency: 'month',
      maxTokens: 800
    });

    // Extract structured data from response content
    // This is a simplified extraction - in production, you might want more sophisticated parsing
    return {
      averagePrice: "Voir recherche récente",
      priceRange: "Variable selon quartier",
      marketTrend: response.content.substring(0, 200) + "...",
      sources: response.citations.slice(0, 3)
    };

  } catch (error) {
    console.error('Error getting current prices:', error);
    throw new Error(`Failed to get current prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get real estate regulations and legal updates
 */
export async function getRealEstateRegulations(topic: string): Promise<{
  content: string;
  lastUpdated: string;
  sources: string[];
}> {
  const query = `réglementation immobilière ${topic} France 2025 nouvelles lois DPE`;

  try {
    const response = await getMarketResearch({
      query,
      searchRecency: 'month',
      maxTokens: 1200
    });

    return {
      content: response.content,
      lastUpdated: new Date().toISOString().split('T')[0],
      sources: response.citations
    };

  } catch (error) {
    console.error('Error getting regulations:', error);
    throw new Error(`Failed to get regulations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}