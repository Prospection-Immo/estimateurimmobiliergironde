import { useEffect } from "react";
import { getLegalConfig } from "@shared/legalConfig";

interface CookiesPageProps {
  domain?: string;
}

export default function CookiesPage({ domain = "estimation-immobilier-gironde.fr" }: CookiesPageProps) {
  const config = getLegalConfig(domain);

  useEffect(() => {
    document.title = `Politique de cookies - ${config.companyName}`;
    
    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `Politique de cookies de ${config.companyName}. Information sur l'utilisation des cookies et vos choix de paramétrage.`);
    }

    // Set Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', `Politique de cookies - ${config.companyName}`);
    }
  }, [config.companyName, domain]);

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="title-cookies">
            Politique de cookies
          </h1>
          <p className="text-muted-foreground" data-testid="text-last-updated">
            Dernière mise à jour : {config.lastUpdated}
          </p>
        </header>

        <div className="space-y-12">
          {/* Qu'est-ce qu'un cookie */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-definition">
              1. Qu'est-ce qu'un cookie ?
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-cookie-definition">
                Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d'un site web. 
                Il permet au site de reconnaître votre navigateur et de conserver certaines informations vous concernant.
              </p>
              <p data-testid="text-cookie-purpose">
                Les cookies facilitent votre navigation et permettent d'améliorer votre expérience utilisateur.
              </p>
            </div>
          </section>

          {/* Cookies utilisés */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-cookies-utilises">
              2. Cookies utilisés sur notre site
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <p data-testid="text-cookies-intro">
                Nous utilisons uniquement des cookies essentiels au fonctionnement de notre site :
              </p>
              
              {config.cookieList.map((cookie, index) => (
                <div key={index} className="border border-border rounded-lg p-6" data-testid={`cookie-item-${index}`}>
                  <h3 className="font-semibold mb-3 text-foreground">{cookie.name}</h3>
                  <div className="space-y-2">
                    <p><strong>Finalité :</strong> {cookie.purpose}</p>
                    <p><strong>Type :</strong> {cookie.type === 'essential' ? 'Essentiel' : cookie.type}</p>
                    <p><strong>Durée de conservation :</strong> {cookie.retention}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Types de cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-types-cookies">
              3. Types de cookies
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Cookies essentiels</h3>
                <p data-testid="text-essential-cookies">
                  Ces cookies sont nécessaires au fonctionnement du site web et ne peuvent pas être désactivés dans nos systèmes. 
                  Ils ne stockent aucune information personnelle identifiable et sont généralement définis en réponse à des actions 
                  que vous effectuez qui équivalent à une demande de services.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-foreground">Cookies analytiques</h3>
                <p data-testid="text-analytics-cookies">
                  <em>Nous n'utilisons actuellement aucun cookie analytique sur notre site.</em>
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-foreground">Cookies publicitaires</h3>
                <p data-testid="text-advertising-cookies">
                  <em>Nous n'utilisons aucun cookie publicitaire sur notre site.</em>
                </p>
              </div>
            </div>
          </section>

          {/* Gestion des cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-gestion">
              4. Gestion de vos cookies
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-essential-notice">
                Les cookies que nous utilisons étant essentiels au fonctionnement du site, ils ne nécessitent pas votre consentement 
                préalable conformément à la réglementation en vigueur.
              </p>
              
              <p data-testid="text-browser-settings">
                Cependant, vous avez la possibilité de gérer les cookies directement depuis votre navigateur :
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">Paramétrage de votre navigateur</h3>
                  <p data-testid="text-browser-instructions">
                    Vous pouvez configurer votre navigateur pour accepter ou refuser les cookies. Voici comment procéder selon votre navigateur :
                  </p>
                </div>

                <ul className="list-disc ml-6 space-y-2" data-testid="list-browser-help">
                  <li><strong>Chrome :</strong> Menu {`>`} Paramètres {`>`} Confidentialité et sécurité {`>`} Cookies et autres données de site</li>
                  <li><strong>Firefox :</strong> Menu {`>`} Options {`>`} Vie privée et sécurité {`>`} Cookies et données de sites</li>
                  <li><strong>Safari :</strong> Préférences {`>`} Confidentialité {`>`} Gérer les données de site web</li>
                  <li><strong>Edge :</strong> Menu {`>`} Paramètres {`>`} Autorisations de site {`>`} Cookies et données stockées</li>
                </ul>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <p data-testid="text-disable-warning">
                  <strong>Attention :</strong> La désactivation des cookies essentiels peut affecter le fonctionnement du site 
                  et empêcher l'accès à certaines fonctionnalités (notamment l'espace d'administration).
                </p>
              </div>
            </div>
          </section>

          {/* Cookies tiers */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-cookies-tiers">
              5. Cookies de tiers
            </h2>
            <p className="text-muted-foreground" data-testid="text-no-third-party">
              Notre site ne fait actuellement appel à aucun service tiers susceptible de déposer des cookies 
              (réseaux sociaux, publicité, analyse d'audience, etc.).
            </p>
          </section>

          {/* Évolution de la politique */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-evolution">
              6. Évolution de notre politique cookies
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-policy-updates">
                Nous nous réservons le droit de modifier cette politique de cookies pour l'adapter aux évolutions 
                de notre site ou aux changements de réglementation.
              </p>
              <p data-testid="text-notification">
                En cas de modification significative, nous vous en informerons par un avis sur notre site web.
              </p>
              <p data-testid="text-continued-use">
                La poursuite de votre navigation sur notre site vaut acceptation de notre politique cookies mise à jour.
              </p>
            </div>
          </section>

          {/* Durée de conservation */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-duree-conservation">
              7. Durée de conservation des cookies
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-session-cookies">
                Les cookies que nous utilisons sont des cookies de session qui sont automatiquement supprimés 
                lorsque vous fermez votre navigateur.
              </p>
              <p data-testid="text-no-persistent">
                Nous ne déposons aucun cookie persistant qui resterait stocké sur votre appareil après la fermeture du navigateur.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-contact">
              8. Contact
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p data-testid="text-contact-info">
                Pour toute question concernant notre utilisation des cookies, vous pouvez nous contacter :
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