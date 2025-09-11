import { useEffect } from "react";
import { getLegalConfig } from "@shared/legalConfig";

interface ConfidentialitePageProps {
  domain?: string;
}

export default function ConfidentialitePage({ domain = "estimation-immobilier-gironde.fr" }: ConfidentialitePageProps) {
  const config = getLegalConfig(domain);

  useEffect(() => {
    document.title = `Politique de confidentialité - ${config.companyName}`;
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `Politique de confidentialité et protection des données personnelles de ${config.companyName}. Conformité RGPD et droits des utilisateurs.`);
    }

    // Set Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', `Politique de confidentialité - ${config.companyName}`);
    }
  }, [config.companyName, domain]);

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="title-confidentialite">
            Politique de confidentialité
          </h1>
          <p className="text-muted-foreground" data-testid="text-last-updated">
            Dernière mise à jour : {config.lastUpdated}
          </p>
        </header>

        <div className="space-y-12">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-introduction">
              1. Introduction
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-intro">
                {config.companyName} accorde une grande importance à la protection de vos données personnelles. 
                Cette politique de confidentialité vous informe sur la manière dont nous collectons, utilisons et protégeons vos données personnelles lorsque vous utilisez notre site web {domain}.
              </p>
              <p data-testid="text-rgpd-compliance">
                Nous nous engageons à respecter le Règlement Général sur la Protection des Données (RGPD) et la loi française Informatique et Libertés.
              </p>
            </div>
          </section>

          {/* Responsable du traitement */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-responsable">
              2. Responsable du traitement
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-responsible-entity">
                Le responsable du traitement des données personnelles est :
              </p>
              <div className="ml-4">
                <p data-testid="text-company-details">
                  <strong>{config.companyName}</strong><br />
                  {config.registeredAddress}<br />
                  Email : {config.contactEmail}<br />
                  Téléphone : {config.contactPhone}
                </p>
              </div>
              {config.dpoContact && (
                <p data-testid="text-dpo-contact">
                  <strong>Délégué à la protection des données (DPO) :</strong> {config.dpoContact}
                </p>
              )}
            </div>
          </section>

          {/* Données collectées */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-donnees-collectees">
              3. Données personnelles collectées
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-data-types">
                Nous collectons les données personnelles suivantes :
              </p>
              <ul className="list-disc ml-6 space-y-2" data-testid="list-collected-data">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone (optionnel)</li>
                <li>Informations sur votre bien immobilier (adresse, type, caractéristiques)</li>
                <li>Informations de projet de financement (type, montant)</li>
                <li>Données de navigation (adresse IP, navigateur, pages visitées)</li>
              </ul>
            </div>
          </section>

          {/* Finalités du traitement */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-finalites">
              4. Finalités du traitement
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-processing-purposes">
                Nous utilisons vos données personnelles pour les finalités suivantes :
              </p>
              <ul className="list-disc ml-6 space-y-2" data-testid="list-purposes">
                {config.dataProcessingPurposes.map((purpose, index) => (
                  <li key={index}>{purpose}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Base légale */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-base-legale">
              5. Base légale du traitement
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-legal-basis">
                Le traitement de vos données personnelles repose sur :
              </p>
              <ul className="list-disc ml-6 space-y-2" data-testid="list-legal-basis">
                {config.legalBasis.map((basis, index) => (
                  <li key={index}>{basis}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Destinataires */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-destinataires">
              6. Destinataires des données
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-recipients">
                Vos données personnelles peuvent être transmises aux destinataires suivants :
              </p>
              <ul className="list-disc ml-6 space-y-2" data-testid="list-recipients">
                <li>Personnel autorisé de {config.companyName}</li>
                <li>Partenaires experts en estimation immobilière</li>
                <li>Courtiers en financement partenaires (uniquement pour les demandes de financement)</li>
                <li>Prestataires techniques (hébergement, maintenance)</li>
              </ul>
              <p data-testid="text-no-sale">
                Nous ne vendons jamais vos données personnelles à des tiers.
              </p>
            </div>
          </section>

          {/* Durée de conservation */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-conservation">
              7. Durée de conservation
            </h2>
            <p className="text-muted-foreground" data-testid="text-retention">
              {config.dataRetention}
            </p>
          </section>

          {/* Vos droits */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-droits">
              8. Vos droits
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-rights-intro">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc ml-6 space-y-2" data-testid="list-rights">
                <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> corriger vos données inexactes ou incomplètes</li>
                <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
                <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
                <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment</li>
              </ul>
              <p data-testid="text-exercise-rights">
                Pour exercer ces droits, contactez-nous à l'adresse : {config.contactEmail}
              </p>
              <p data-testid="text-complaint-right">
                Vous avez également le droit de déposer une plainte auprès de la CNIL si vous estimez que vos droits ne sont pas respectés.
              </p>
            </div>
          </section>

          {/* Sécurité */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-securite">
              9. Sécurité des données
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-security-measures">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre :
              </p>
              <ul className="list-disc ml-6 space-y-2" data-testid="list-security">
                <li>L'accès non autorisé</li>
                <li>La divulgation</li>
                <li>La modification</li>
                <li>La destruction</li>
              </ul>
            </div>
          </section>

          {/* Transferts internationaux */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-transferts">
              10. Transferts internationaux
            </h2>
            <p className="text-muted-foreground" data-testid="text-transfers">
              Certaines de vos données peuvent être transférées vers des pays situés en dehors de l'Union européenne, notamment vers les États-Unis (hébergement). 
              Ces transferts sont encadrés par des garanties appropriées conformément au RGPD.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-modifications">
              11. Modifications de la politique
            </h2>
            <p className="text-muted-foreground" data-testid="text-policy-changes">
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
              Les modifications seront publiées sur cette page avec la date de mise à jour.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-contact">
              12. Contact
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-contact-info">
                Pour toute question concernant cette politique de confidentialité ou l'exercice de vos droits, contactez-nous :
              </p>
              <div className="ml-4">
                <p data-testid="text-contact-details">
                  Email : {config.contactEmail}<br />
                  Téléphone : {config.contactPhone}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}