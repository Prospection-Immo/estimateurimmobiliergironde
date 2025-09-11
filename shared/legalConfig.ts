export interface LegalConfig {
  companyName: string;
  legalEntityType: string;
  siret?: string;
  registeredAddress: string;
  contactEmail: string;
  contactPhone: string;
  directorName: string;
  hostProvider: {
    name: string;
    address: string;
  };
  dpoContact?: string;
  lastUpdated: string;
  cookieList: Array<{
    name: string;
    purpose: string;
    type: 'essential' | 'analytics' | 'marketing' | 'preferences';
    retention: string;
  }>;
  dataProcessingPurposes: string[];
  legalBasis: string[];
  dataRetention: string;
}

const defaultLegalConfig: LegalConfig = {
  companyName: "Estimation Gironde",
  legalEntityType: "Entreprise individuelle",
  siret: "En cours d'immatriculation",
  registeredAddress: "12 Place de la Bourse, 33000 Bordeaux, France", 
  contactEmail: "contact@estimation-immobilier-gironde.fr",
  contactPhone: "05 56 12 34 56",
  directorName: "Responsable de publication",
  hostProvider: {
    name: "Replit, Inc.",
    address: "San Francisco, CA, USA"
  },
  dpoContact: "dpo@estimation-immobilier-gironde.fr",
  lastUpdated: "2025-09-11",
  cookieList: [
    {
      name: "connect.sid",
      purpose: "Session d'authentification administrateur",
      type: "essential",
      retention: "Session (supprimé à la fermeture du navigateur)"
    }
  ],
  dataProcessingPurposes: [
    "Traitement des demandes d'estimation immobilière",
    "Traitement des demandes de financement",
    "Communication avec les prospects",
    "Gestion administrative du site web"
  ],
  legalBasis: [
    "Consentement de la personne concernée",
    "Exécution d'un contrat ou de mesures précontractuelles",
    "Intérêt légitime du responsable de traitement"
  ],
  dataRetention: "Les données personnelles sont conservées pendant 3 ans maximum à compter du dernier contact, sauf obligation légale contraire."
};

const domainConfigs: Record<string, Partial<LegalConfig>> = {
  "estimation-immobilier-gironde.fr": {},
  // Add other domain-specific overrides here
};

export function getLegalConfig(domain: string): LegalConfig {
  const overrides = domainConfigs[domain] || {};
  return { ...defaultLegalConfig, ...overrides };
}