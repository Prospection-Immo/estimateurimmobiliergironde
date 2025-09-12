import { useState, useEffect } from "react";

export interface LeadContext {
  firstName: string;
  email: string;
  city: string;
  guideSlug: string;
  token?: string;
}

// Centralized lead context hook with RGPD-compliant localStorage-only approach
export function useLeadContext() {
  const [leadContext, setLeadContext] = useState<LeadContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only use localStorage (RGPD-compliant) - NO URL fallback
    const storedContext = localStorage.getItem('guide-lead-context');
    if (storedContext) {
      try {
        const parsed = JSON.parse(storedContext);
        setLeadContext(parsed);
      } catch (error) {
        console.error('Error parsing stored lead context:', error);
        localStorage.removeItem('guide-lead-context');
      }
    }
    setIsLoading(false);
  }, []);

  const updateLeadContext = (context: LeadContext | null) => {
    setLeadContext(context);
    if (context) {
      localStorage.setItem('guide-lead-context', JSON.stringify(context));
    } else {
      localStorage.removeItem('guide-lead-context');
    }
  };

  const clearLeadContext = () => {
    setLeadContext(null);
    localStorage.removeItem('guide-lead-context');
  };

  return { 
    leadContext, 
    updateLeadContext, 
    clearLeadContext,
    isLoading 
  };
}