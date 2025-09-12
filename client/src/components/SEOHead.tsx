import { useEffect } from 'react';

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
}

interface TwitterCardData {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
}

interface StructuredDataObject {
  "@context": string;
  "@type": string;
  [key: string]: any;
}

interface SEOHeadProps {
  // Meta tags de base
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  
  // Open Graph
  openGraph?: OpenGraphData;
  
  // Twitter Cards
  twitterCard?: TwitterCardData;
  
  // Structured Data (JSON-LD)
  structuredData?: StructuredDataObject | StructuredDataObject[];
  
  // Meta additionnels
  robots?: string;
  author?: string;
  publisher?: string;
}

export default function SEOHead({
  title,
  description,
  keywords = [],
  canonical,
  openGraph = {},
  twitterCard = {},
  structuredData,
  robots = 'index, follow',
  author = 'Estimation Immobilière Gironde',
  publisher = 'Estimation Immobilière Gironde'
}: SEOHeadProps) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    updateMetaTag('name', 'description', description);
    
    // Meta keywords
    if (keywords.length > 0) {
      updateMetaTag('name', 'keywords', keywords.join(', '));
    }
    
    // Meta robots
    updateMetaTag('name', 'robots', robots);
    
    // Meta author
    updateMetaTag('name', 'author', author);
    
    // Meta publisher
    updateMetaTag('name', 'publisher', publisher);
    
    // Canonical URL
    if (canonical) {
      updateLinkTag('canonical', canonical);
    }
    
    // Open Graph tags
    const ogData = {
      title: title,
      description: description,
      type: 'website',
      siteName: 'Estimation Immobilière Gironde',
      locale: 'fr_FR',
      ...openGraph
    };
    
    Object.entries(ogData).forEach(([key, value]) => {
      if (value) {
        updateMetaTag('property', `og:${key}`, value.toString());
      }
    });
    
    // Twitter Card tags
    const twitterData = {
      card: 'summary_large_image',
      site: '@EstimationGironde',
      ...twitterCard
    };
    
    Object.entries(twitterData).forEach(([key, value]) => {
      if (value) {
        updateMetaTag('name', `twitter:${key}`, value.toString());
      }
    });
    
    // Structured Data (JSON-LD)
    if (structuredData) {
      const dataArray = Array.isArray(structuredData) ? structuredData : [structuredData];
      
      // Remove existing structured data
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());
      
      // Add new structured data
      dataArray.forEach((data, index) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data);
        script.setAttribute('data-seo', 'structured-data');
        document.head.appendChild(script);
      });
    }
    
    // Cleanup function
    return () => {
      // Remove structured data on unmount
      const scripts = document.querySelectorAll('script[data-seo="structured-data"]');
      scripts.forEach(script => script.remove());
    };
  }, [title, description, keywords, canonical, openGraph, twitterCard, structuredData, robots, author, publisher]);

  return null; // Ce composant ne rend rien visuellement
}

// Utility functions
function updateMetaTag(attribute: string, attributeValue: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  
  if (element) {
    element.setAttribute('content', content);
  } else {
    element = document.createElement('meta');
    element.setAttribute(attribute, attributeValue);
    element.setAttribute('content', content);
    document.head.appendChild(element);
  }
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`);
  
  if (element) {
    element.setAttribute('href', href);
  } else {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    element.setAttribute('href', href);
    document.head.appendChild(element);
  }
}

// Factory functions pour structured data communes
export const createLocalBusinessSchema = (name: string, description: string, address: string, city: string, postalCode: string, phone: string, email: string, website: string) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": name,
  "description": description,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": address,
    "addressLocality": city,
    "postalCode": postalCode,
    "addressCountry": "FR"
  },
  "telephone": phone,
  "email": email,
  "url": website,
  "areaServed": {
    "@type": "State",
    "name": "Gironde"
  },
  "serviceType": "Estimation immobilière",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Services d'estimation immobilière",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Estimation gratuite en ligne",
          "description": "Estimation rapide et gratuite de votre bien immobilier en Gironde"
        }
      },
      {
        "@type": "Offer", 
        "itemOffered": {
          "@type": "Service",
          "name": "Guides vendeurs personnalisés",
          "description": "Guides PDF spécialisés selon votre profil de vendeur"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service", 
          "name": "Accompagnement financement",
          "description": "Solutions de financement immobilier personnalisées"
        }
      }
    ]
  }
});

export const createRealEstateSchema = (propertyType: string, city: string, estimatedValue?: number) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": `Estimation ${propertyType} ${city}`,
  "description": `Service d'estimation gratuite pour ${propertyType} situé à ${city} en Gironde`,
  "provider": {
    "@type": "LocalBusiness",
    "name": "Estimation Immobilière Gironde",
    "areaServed": {
      "@type": "State", 
      "name": "Gironde"
    }
  },
  "serviceType": "Estimation immobilière",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR",
    "description": "Estimation gratuite et sans engagement"
  }
});

export const createFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

export const createArticleSchema = (title: string, description: string, author: string, datePublished: string, dateModified: string, url: string, image?: string) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": title,
  "description": description,
  "author": {
    "@type": "Person",
    "name": author
  },
  "publisher": {
    "@type": "Organization",
    "name": "Estimation Immobilière Gironde"
  },
  "datePublished": datePublished,
  "dateModified": dateModified,
  "url": url,
  ...(image && { "image": image })
});