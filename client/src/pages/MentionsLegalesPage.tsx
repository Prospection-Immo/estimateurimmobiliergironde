import { useEffect } from "react";
import { getLegalConfig } from "@shared/legalConfig";

interface MentionsLegalesPageProps {
  domain?: string;
}

export default function MentionsLegalesPage({ domain = "estimation-immobilier-gironde.fr" }: MentionsLegalesPageProps) {
  const config = getLegalConfig(domain);

  useEffect(() => {
    document.title = `Mentions légales - ${config.companyName}`;
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `Mentions légales du site ${domain}. Informations sur l'éditeur, l'hébergeur et les conditions d'utilisation du service d'estimation immobilière.`);
    }

    // Set Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', `Mentions légales - ${config.companyName}`);
    }
  }, [config.companyName, domain]);

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="title-mentions-legales">
            Mentions légales
          </h1>
          <p className="text-muted-foreground" data-testid="text-last-updated">
            Dernière mise à jour : {config.lastUpdated}
          </p>
        </header>

        <div className="space-y-12">
          {/* Éditeur du site */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-editeur">
              1. Éditeur du site
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-company-name">
                <strong>Dénomination sociale :</strong> {config.companyName}
              </p>
              <p data-testid="text-legal-form">
                <strong>Forme juridique :</strong> {config.legalEntityType}
              </p>
              {config.siret && (
                <p data-testid="text-siret">
                  <strong>SIRET :</strong> {config.siret}
                </p>
              )}
              <p data-testid="text-address">
                <strong>Adresse du siège social :</strong> {config.registeredAddress}
              </p>
              <p data-testid="text-contact-email">
                <strong>Email :</strong> {config.contactEmail}
              </p>
              <p data-testid="text-contact-phone">
                <strong>Téléphone :</strong> {config.contactPhone}
              </p>
            </div>
          </section>

          {/* Directeur de la publication */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-directeur">
              2. Directeur de la publication
            </h2>
            <p className="text-muted-foreground" data-testid="text-director-name">
              {config.directorName}
            </p>
          </section>

          {/* Hébergement */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-hebergement">
              3. Hébergement
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-host-name">
                <strong>Hébergeur :</strong> {config.hostProvider.name}
              </p>
              <p data-testid="text-host-address">
                <strong>Adresse :</strong> {config.hostProvider.address}
              </p>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-propriete">
              4. Propriété intellectuelle
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-copyright">
                L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
              </p>
              <p data-testid="text-reproduction">
                La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
              </p>
            </div>
          </section>

          {/* Responsabilité */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-responsabilite">
              5. Responsabilité
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-estimation-info">
                Les informations diffusées sur le site {domain} sont fournies à titre informatif. Les estimations immobilières proposées sont indicatives et ne constituent pas une expertise officielle.
              </p>
              <p data-testid="text-no-guarantee">
                {config.companyName} s'efforce de fournir des informations aussi précises que possible mais ne peut garantir l'exactitude, la complétude ou l'actualité des informations diffusées sur son site.
              </p>
              <p data-testid="text-liability-limit">
                En conséquence, l'utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive.
              </p>
            </div>
          </section>

          {/* Données personnelles */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-donnees">
              6. Protection des données personnelles
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-data-processing">
                Le traitement des données personnelles collectées sur ce site est effectué conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
              </p>
              <p data-testid="text-privacy-policy">
                Pour plus d'informations, consultez notre <a href="/politique-de-confidentialite" className="text-primary hover:underline">politique de confidentialité</a>.
              </p>
            </div>
          </section>

          {/* Droit applicable */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-droit">
              7. Droit applicable et juridiction
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-french-law">
                Les présentes mentions légales sont régies par le droit français.
              </p>
              <p data-testid="text-jurisdiction">
                En cas de litige, les tribunaux français seront seuls compétents.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}