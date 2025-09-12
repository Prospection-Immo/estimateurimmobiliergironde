import { storage } from '../storage';
import type { InsertEmailTemplate, GuidePersona } from '@shared/schema';
import { GUIDE_PERSONAS } from '@shared/schema';

interface TemplateConfig {
  category: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

class EmailTemplateGenerator {
  private baseUrl: string;
  private siteName: string;
  private brandColor: string;

  constructor() {
    this.baseUrl = process.env.VITE_APP_URL || 'https://estimation-immobilier-gironde.fr';
    this.siteName = 'Estimation Immobilier Gironde';
    this.brandColor = '#2563eb';
  }

  /**
   * Génère le style CSS de base pour tous les emails
   */
  private getBaseEmailStyles(): string {
    return `
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f8fafc;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, ${this.brandColor} 0%, #1d4ed8 100%);
          color: white; 
          padding: 30px 20px; 
          text-align: center;
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600;
        }
        .header p { 
          margin: 10px 0 0 0; 
          opacity: 0.9;
          font-size: 16px;
        }
        .content { 
          padding: 40px 30px; 
        }
        .content h2 { 
          color: #1f2937; 
          font-size: 22px; 
          margin: 0 0 20px 0;
          font-weight: 600;
        }
        .content p { 
          margin: 0 0 16px 0; 
          font-size: 16px; 
          line-height: 1.6;
        }
        .highlight-box {
          background: #f0f9ff;
          border-left: 4px solid ${this.brandColor};
          padding: 20px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .cta-button { 
          display: inline-block; 
          background: ${this.brandColor};
          color: white; 
          text-decoration: none; 
          padding: 15px 30px; 
          border-radius: 8px; 
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: background-color 0.3s ease;
        }
        .cta-button:hover {
          background: #1d4ed8;
        }
        .footer { 
          background: #f8fafc; 
          padding: 30px 20px; 
          text-align: center; 
          font-size: 14px; 
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .footer a { 
          color: ${this.brandColor}; 
          text-decoration: none;
        }
        .social-links {
          margin: 20px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #6b7280;
          text-decoration: none;
        }
        .unsubscribe {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 20px;
        }
        .persona-badge {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 15px;
        }
        .testimonial {
          background: #fafafa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          font-style: italic;
        }
        .testimonial-author {
          font-weight: 600;
          margin-top: 10px;
          font-style: normal;
          color: #6b7280;
        }
        @media only screen and (max-width: 600px) {
          .email-container { margin: 0; }
          .content { padding: 30px 20px; }
          .header { padding: 20px 15px; }
          .footer { padding: 20px 15px; }
          .cta-button { padding: 12px 25px; font-size: 15px; }
        }
      </style>
    `;
  }

  /**
   * Génère le header HTML standard
   */
  private getEmailHeader(title: string, subtitle: string): string {
    return `
      <div class="header">
        <h1>🏠 ${this.siteName}</h1>
        <p>${subtitle}</p>
      </div>
    `;
  }

  /**
   * Génère le footer HTML standard
   */
  private getEmailFooter(): string {
    return `
      <div class="footer">
        <div class="social-links">
          <a href="${this.baseUrl}">🌐 Notre site</a>
          <a href="${this.baseUrl}/guides">📚 Nos guides</a>
          <a href="${this.baseUrl}/actualites">📰 Actualités</a>
        </div>
        <p>
          <strong>${this.siteName}</strong><br>
          Votre expert en estimation immobilière en Gironde<br>
          <a href="${this.baseUrl}">estimation-immobilier-gironde.fr</a>
        </p>
        <div class="unsubscribe">
          <p>
            Vous recevez cet email car vous avez téléchargé un de nos guides.<br>
            <a href="{{unsubscribeLink}}">Se désabonner</a> | 
            <a href="${this.baseUrl}/confidentialite">Politique de confidentialité</a>
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Génère un template de livraison de guide
   */
  private generateGuideDeliveryTemplate(persona: GuidePersona): TemplateConfig {
    const personaName = GUIDE_PERSONAS[persona];
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Votre guide est prêt !</title>
        ${this.getBaseEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          ${this.getEmailHeader('Votre guide est prêt !', 'Guide spécialement conçu pour les vendeurs pressés')}
          
          <div class="content">
            <div class="persona-badge">Profile ${personaName}</div>
            <h2>Bonjour {{firstName}} 👋</h2>
            
            <p>Parfait ! Votre guide personnalisé "<strong>{{guideTitle}}</strong>" est maintenant accessible.</p>
            
            <div class="highlight-box">
              <p><strong>Ce guide contient exactement ce dont vous avez besoin en tant que ${personaName.toLowerCase()} :</strong></p>
              ${this.getPersonaSpecificBenefits(persona)}
            </div>

            <p>Cliquez ci-dessous pour accéder à votre guide complet :</p>
            
            <a href="${this.baseUrl}/guides/{{guideSlug}}/read" class="cta-button">
              📖 Lire mon guide maintenant
            </a>

            <p><strong>🎁 Bonus exclusif :</strong> En plus du guide, vous recevrez dans les prochains jours des conseils pratiques et des retours d'expérience d'autres vendeurs dans votre situation.</p>

            <p>Si vous avez des questions spécifiques sur votre situation, n'hésitez pas à me répondre directement. Je serai ravi de vous aider.</p>

            <p>À très bientôt,</p>
            <p><strong>L'équipe ${this.siteName}</strong></p>
          </div>

          ${this.getEmailFooter()}
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Bonjour {{firstName}},

      Parfait ! Votre guide personnalisé "{{guideTitle}}" est maintenant accessible.

      Accédez à votre guide : ${this.baseUrl}/guides/{{guideSlug}}/read

      En bonus, vous recevrez prochainement des conseils pratiques adaptés à votre profil de ${personaName.toLowerCase()}.

      Cordialement,
      L'équipe ${this.siteName}

      Se désabonner : {{unsubscribeLink}}
    `;

    return {
      category: `guide_delivery_${persona}`,
      name: `Livraison guide - ${personaName}`,
      subject: `{{firstName}}, votre guide est prêt ! 🏠`,
      htmlContent,
      textContent,
      variables: ['firstName', 'guideTitle', 'guideSlug', 'unsubscribeLink']
    };
  }

  /**
   * Génère un template de conseil (tip)
   */
  private generateTipTemplate(persona: GuidePersona): TemplateConfig {
    const personaName = GUIDE_PERSONAS[persona];
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conseil exclusif pour vous</title>
        ${this.getBaseEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          ${this.getEmailHeader('Conseil exclusif', 'Pour optimiser votre vente immobilière')}
          
          <div class="content">
            <div class="persona-badge">Profile ${personaName}</div>
            <h2>{{firstName}}, voici un conseil qui va vous faire gagner du temps ⚡</h2>
            
            <p>J'espère que votre guide vous a été utile ! Aujourd'hui, je partage avec vous un conseil spécifique pour les ${personaName.toLowerCase()}s comme vous.</p>
            
            <div class="highlight-box">
              <h3>💡 Conseil du jour :</h3>
              ${this.getPersonaSpecificTip(persona)}
            </div>

            ${this.getPersonaSpecificCTA(persona)}

            <p>Ce conseil a aidé de nombreux vendeurs dans votre situation à optimiser leur vente. N'hésitez pas à me poser vos questions si vous voulez approfondir.</p>

            <p>Excellente journée,</p>
            <p><strong>L'équipe ${this.siteName}</strong></p>
          </div>

          ${this.getEmailFooter()}
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Bonjour {{firstName}},

      Voici un conseil spécifique pour les ${personaName.toLowerCase()}s :

      ${this.getPersonaSpecificTip(persona, true)}

      Pour aller plus loin : ${this.baseUrl}

      Cordialement,
      L'équipe ${this.siteName}

      Se désabonner : {{unsubscribeLink}}
    `;

    return {
      category: `tip_${persona}`,
      name: `Conseil pratique - ${personaName}`,
      subject: `{{firstName}}, ${this.getPersonaSpecificSubject(persona)} 💡`,
      htmlContent,
      textContent,
      variables: ['firstName', 'unsubscribeLink']
    };
  }

  /**
   * Génère un template de cas d'étude
   */
  private generateCaseStudyTemplate(persona: GuidePersona): TemplateConfig {
    const personaName = GUIDE_PERSONAS[persona];
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Retour d'expérience</title>
        ${this.getBaseEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          ${this.getEmailHeader('Retour d\'expérience', 'Un vendeur dans votre situation témoigne')}
          
          <div class="content">
            <div class="persona-badge">Profile ${personaName}</div>
            <h2>{{firstName}}, cette histoire va vous inspirer 🌟</h2>
            
            <p>Aujourd'hui, je partage avec vous l'expérience de ${this.getPersonaCaseStudyName(persona)}, un vendeur dans votre situation qui a réussi sa vente.</p>
            
            <div class="testimonial">
              "${this.getPersonaCaseStudyContent(persona)}"
              <div class="testimonial-author">- ${this.getPersonaCaseStudyName(persona)}, vendeur en Gironde</div>
            </div>

            <div class="highlight-box">
              <h3>🎯 Les 3 clés de sa réussite :</h3>
              ${this.getPersonaCaseStudyKeys(persona)}
            </div>

            <p>Vous vous reconnaissez dans cette situation ? Vous pouvez obtenir les mêmes résultats.</p>

            <a href="${this.baseUrl}/contact" class="cta-button">
              🚀 Obtenir une estimation personnalisée
            </a>

            <p>N'hésitez pas à me contacter si vous voulez discuter de votre situation spécifique.</p>

            <p>Cordialement,</p>
            <p><strong>L'équipe ${this.siteName}</strong></p>
          </div>

          ${this.getEmailFooter()}
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Bonjour {{firstName}},

      Voici l'expérience inspirante de ${this.getPersonaCaseStudyName(persona)} :

      ${this.getPersonaCaseStudyContent(persona, true)}

      Les 3 clés de sa réussite :
      ${this.getPersonaCaseStudyKeys(persona, true)}

      Vous pouvez obtenir les mêmes résultats : ${this.baseUrl}/contact

      Cordialement,
      L'équipe ${this.siteName}

      Se désabonner : {{unsubscribeLink}}
    `;

    return {
      category: `case_study_${persona}`,
      name: `Cas d'étude - ${personaName}`,
      subject: `{{firstName}}, comment ${this.getPersonaCaseStudyName(persona)} a réussi sa vente 🌟`,
      htmlContent,
      textContent,
      variables: ['firstName', 'unsubscribeLink']
    };
  }

  /**
   * Génère un template d'offre douce
   */
  private generateSoftOfferTemplate(persona: GuidePersona): TemplateConfig {
    const personaName = GUIDE_PERSONAS[persona];
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prêt pour l'étape suivante ?</title>
        ${this.getBaseEmailStyles()}
      </head>
      <body>
        <div class="email-container">
          ${this.getEmailHeader('Prêt pour l\'étape suivante ?', 'Accompagnement personnalisé disponible')}
          
          <div class="content">
            <div class="persona-badge">Profile ${personaName}</div>
            <h2>{{firstName}}, et si on passait à l'action ? 🚀</h2>
            
            <p>Ces derniers jours, vous avez reçu des conseils spécialement adaptés à votre profil de ${personaName.toLowerCase()}. J'espère qu'ils vous ont été utiles !</p>
            
            <p>Maintenant, vous vous demandez peut-être : <em>"Comment concrètement appliquer tout cela à MA situation ?"</em></p>

            <div class="highlight-box">
              <h3>🎯 Si vous êtes prêt(e) à passer à l'étape suivante :</h3>
              ${this.getPersonaOfferContent(persona)}
            </div>

            <a href="${this.baseUrl}/contact?source=email_sequence&persona={{persona}}&step={{sequenceStep}}" class="cta-button">
              📞 Échanger sur ma situation (Gratuit)
            </a>

            <p><strong>Aucune obligation</strong> - il s'agit simplement d'un échange pour comprendre votre situation et voir comment nous pouvons vous aider concrètement.</p>

            <div class="testimonial">
              "Grâce à cet accompagnement, j'ai pu vendre 15% au-dessus de mon estimation initiale et en seulement 6 semaines !"
              <div class="testimonial-author">- Marie L., ${this.getPersonaCityExample(persona)}</div>
            </div>

            <p>Si ce n'est pas le bon moment, pas de souci ! Vous pouvez garder mes conseils sous la main et revenir vers moi quand vous serez prêt(e).</p>

            <p>Excellente journée,</p>
            <p><strong>L'équipe ${this.siteName}</strong></p>
          </div>

          ${this.getEmailFooter()}
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Bonjour {{firstName}},

      Prêt(e) à passer à l'étape suivante ?

      ${this.getPersonaOfferContent(persona, true)}

      Échangeons sur votre situation (gratuit) : ${this.baseUrl}/contact?source=email_sequence&persona={{persona}}

      Aucune obligation - juste un échange pour voir comment vous aider concrètement.

      Cordialement,
      L'équipe ${this.siteName}

      Se désabonner : {{unsubscribeLink}}
    `;

    return {
      category: `soft_offer_${persona}`,
      name: `Offre accompagnement - ${personaName}`,
      subject: `{{firstName}}, ${this.getPersonaOfferSubject(persona)} 🚀`,
      htmlContent,
      textContent,
      variables: ['firstName', 'persona', 'sequenceStep', 'unsubscribeLink']
    };
  }

  // Méthodes utilitaires pour le contenu spécifique à chaque persona

  private getPersonaSpecificBenefits(persona: GuidePersona): string {
    const benefits = {
      presse: `
        <ul>
          <li>✅ Checklist pour vendre en moins de 2 mois</li>
          <li>✅ Les 5 actions prioritaires à faire immédiatement</li>
          <li>✅ Comment éviter les pièges qui font traîner la vente</li>
        </ul>
      `,
      maximisateur: `
        <ul>
          <li>✅ Stratégies pour vendre au meilleur prix</li>
          <li>✅ Les 7 leviers pour maximiser la valeur</li>
          <li>✅ Négociation : comment obtenir 5-10% de plus</li>
        </ul>
      `,
      succession: `
        <ul>
          <li>✅ Démarches administratives simplifiées</li>
          <li>✅ Optimisation fiscale de la succession</li>
          <li>✅ Gestion des co-héritiers en toute sérénité</li>
        </ul>
      `,
      nouvelle_vie: `
        <ul>
          <li>✅ Planification de votre nouveau projet de vie</li>
          <li>✅ Coordination achat/vente sans stress</li>
          <li>✅ Optimisation du timing pour votre déménagement</li>
        </ul>
      `,
      investisseur: `
        <ul>
          <li>✅ Optimisation fiscale de la revente</li>
          <li>✅ Stratégies pour réinvestir efficacement</li>
          <li>✅ Analyse ROI et plus-values immobilières</li>
        </ul>
      `,
      primo: `
        <ul>
          <li>✅ Guide pas-à-pas pour votre première vente</li>
          <li>✅ Éviter les erreurs classiques des débutants</li>
          <li>✅ Accompagnement pour être serein tout au long du processus</li>
        </ul>
      `
    };
    return benefits[persona];
  }

  private getPersonaSpecificTip(persona: GuidePersona, isText = false): string {
    const tips = {
      presse: `Pour vendre rapidement, misez sur la première impression. ${isText ? '' : '<strong>'}90% des acheteurs se décident dans les 10 premières secondes${isText ? '' : '</strong>'}. Désencombrez complètement, nettoyez en profondeur et créez une ambiance accueillante avec quelques plantes et une bonne luminosité.`,
      maximisateur: `Pour maximiser le prix, ${isText ? '' : '<strong>'}listez tous les "plus" de votre bien${isText ? '' : '</strong>'} : proximité commerces, transports, écoles, calme, luminosité, etc. Créez un dossier de vente complet avec ces atouts chiffrés (temps d'accès, services à proximité).`,
      succession: `Pour une succession sereine, ${isText ? '' : '<strong>'}établissez un mandat de vente au nom de tous les héritiers${isText ? '' : '</strong>'}. Cela évite les blocages et accélère les démarches. Pensez aussi à regrouper tous les documents (actes, diagnostics) en amont.`,
      nouvelle_vie: `Pour coordonner achat et vente, ${isText ? '' : '<strong>'}négociez une clause de vente conditionnelle${isText ? '' : '</strong>'} dans votre promesse d'achat. Cela vous donne du temps pour vendre et évite le stress financier d'un double portage.`,
      investisseur: `Pour optimiser votre fiscalité, ${isText ? '' : '<strong>'}documentez tous vos travaux d'amélioration${isText ? '' : '</strong>'}. Ils peuvent être déduits de la plus-value imposable. Gardez toutes les factures depuis l'achat !`,
      primo: `Pour votre première vente, ${isText ? '' : '<strong>'}faites estimer votre bien par 2-3 professionnels${isText ? '' : '</strong>'}. Cela vous donne une fourchette fiable et vous évite de sous-évaluer ou surévaluer votre bien.`
    };
    return tips[persona];
  }

  private getPersonaSpecificSubject(persona: GuidePersona): string {
    const subjects = {
      presse: 'Ce conseil va accélérer votre vente',
      maximisateur: 'Comment augmenter votre prix de vente',
      succession: 'Simplifiez vos démarches de succession',
      nouvelle_vie: 'Coordonnez parfaitement vos projets',
      investisseur: 'Optimisez votre fiscalité immobilière',
      primo: 'Évitez cette erreur de débutant'
    };
    return subjects[persona];
  }

  private getPersonaSpecificCTA(persona: GuidePersona): string {
    const ctas = {
      presse: `<a href="${this.baseUrl}/guides" class="cta-button">📚 Voir tous nos guides rapides</a>`,
      maximisateur: `<a href="${this.baseUrl}/estimation" class="cta-button">💰 Estimer mon bien gratuitement</a>`,
      succession: `<a href="${this.baseUrl}/lexique" class="cta-button">📖 Lexique succession immobilière</a>`,
      nouvelle_vie: `<a href="${this.baseUrl}/financement" class="cta-button">🏡 Solutions de financement</a>`,
      investisseur: `<a href="${this.baseUrl}/actualites" class="cta-button">📈 Actualités marché immobilier</a>`,
      primo: `<a href="${this.baseUrl}/guides" class="cta-button">🎓 Guides pour débutants</a>`
    };
    return ctas[persona];
  }

  private getPersonaCaseStudyName(persona: GuidePersona): string {
    const names = {
      presse: 'Thomas M.',
      maximisateur: 'Sophie L.',
      succession: 'Michel et Anne D.',
      nouvelle_vie: 'Catherine B.',
      investisseur: 'Jean-Pierre R.',
      primo: 'Amélie et Julien'
    };
    return names[persona];
  }

  private getPersonaCaseStudyContent(persona: GuidePersona, isText = false): string {
    const stories = {
      presse: `J'avais besoin de vendre rapidement pour ma mutation professionnelle. Grâce aux conseils reçus, j'ai pu présenter mon appartement sous son meilleur jour et le vendre en 3 semaines au prix souhaité !`,
      maximisateur: `Mon objectif était de tirer le maximum de ma maison familiale. En suivant la stratégie de mise en valeur proposée, j'ai obtenu 8% de plus que l'estimation initiale. Chaque euro compte !`,
      succession: `Après le décès de papa, nous devions vendre la maison familiale à 4 héritiers. L'accompagnement nous a permis de gérer sereinement toutes les démarches et de vendre dans les meilleures conditions.`,
      nouvelle_vie: `Nous voulions nous rapprocher de nos enfants à la retraite. L'équipe nous a aidés à coordonner la vente de notre maison et l'achat de notre appartement. Transition parfaite !`,
      investisseur: `Je vendais un appartement locatif pour réinvestir ailleurs. Les conseils fiscaux m'ont fait économiser plusieurs milliers d'euros en optimisant ma plus-value.`,
      primo: `Notre première vente nous stressait énormément. L'accompagnement pas-à-pas nous a rassurés et tout s'est parfaitement déroulé. Nous recommendons à 100% !`
    };
    return stories[persona];
  }

  private getPersonaCaseStudyKeys(persona: GuidePersona, isText = false): string {
    const keys = {
      presse: isText ? 
        '1. Préparation express du bien\n2. Prix juste dès le départ\n3. Communication ciblée' :
        '<ol><li><strong>Préparation express du bien</strong> en 48h</li><li><strong>Prix juste dès le départ</strong> pour éviter les négociations</li><li><strong>Communication ciblée</strong> vers les bons profils</li></ol>',
      maximisateur: isText ?
        '1. Mise en valeur professionnelle\n2. Documentation complète des atouts\n3. Négociation experte' :
        '<ol><li><strong>Mise en valeur professionnelle</strong> du bien</li><li><strong>Documentation complète</strong> de tous les atouts</li><li><strong>Négociation experte</strong> pour obtenir le meilleur prix</li></ol>',
      succession: isText ?
        '1. Préparation administrative anticipée\n2. Coordination entre héritiers\n3. Accompagnement juridique' :
        '<ol><li><strong>Préparation administrative anticipée</strong></li><li><strong>Coordination entre héritiers</strong> facilitée</li><li><strong>Accompagnement juridique</strong> pour éviter les erreurs</li></ol>',
      nouvelle_vie: isText ?
        '1. Planification coordonnée\n2. Solutions de financement adaptées\n3. Timing optimisé' :
        '<ol><li><strong>Planification coordonnée</strong> achat/vente</li><li><strong>Solutions de financement</strong> adaptées</li><li><strong>Timing optimisé</strong> pour le déménagement</li></ol>',
      investisseur: isText ?
        '1. Optimisation fiscale maximale\n2. Stratégie de réinvestissement\n3. Analyse ROI précise' :
        '<ol><li><strong>Optimisation fiscale maximale</strong></li><li><strong>Stratégie de réinvestissement</strong> claire</li><li><strong>Analyse ROI précise</strong> pour la décision</li></ol>',
      primo: isText ?
        '1. Accompagnement rassurant\n2. Évitement des pièges classiques\n3. Suivi personnalisé' :
        '<ol><li><strong>Accompagnement rassurant</strong> à chaque étape</li><li><strong>Évitement des pièges classiques</strong></li><li><strong>Suivi personnalisé</strong> jusqu\'à la signature</li></ol>'
    };
    return keys[persona];
  }

  private getPersonaOfferContent(persona: GuidePersona, isText = false): string {
    const offers = {
      presse: `Je vous propose un appel gratuit de 15 minutes pour analyser votre situation et vous donner un plan d'action précis pour vendre rapidement. ${isText ? '' : '<strong>'}Objectif : vendre en moins de 60 jours${isText ? '' : '</strong>'}.`,
      maximisateur: `Obtenez une estimation détaillée gratuite avec analyse des leviers pour maximiser votre prix de vente. ${isText ? '' : '<strong>'}Objectif : vendre 5 à 10% au-dessus du marché${isText ? '' : '</strong>'}.`,
      succession: `Bénéficiez d'un accompagnement complet pour votre succession immobilière, de A à Z. ${isText ? '' : '<strong>'}Objectif : gérer sereinement toutes les démarches${isText ? '' : '</strong>'}.`,
      nouvelle_vie: `Planifions ensemble votre nouveau projet de vie avec une stratégie coordonnée achat/vente. ${isText ? '' : '<strong>'}Objectif : transition sans stress financier${isText ? '' : '</strong>'}.`,
      investisseur: `Analysons ensemble votre stratégie patrimoniale et les optimisations fiscales possibles. ${isText ? '' : '<strong>'}Objectif : maximiser votre rentabilité${isText ? '' : '</strong>'}.`,
      primo: `Accompagnement complet pour votre première vente, avec suivi personnalisé. ${isText ? '' : '<strong>'}Objectif : vous rassurer à chaque étape${isText ? '' : '</strong>'}.`
    };
    return offers[persona];
  }

  private getPersonaOfferSubject(persona: GuidePersona): string {
    const subjects = {
      presse: 'prêt(e) à vendre rapidement ?',
      maximisateur: 'et si on maximisait votre prix ?',
      succession: 'simplifions votre succession',
      nouvelle_vie: 'concrétisons votre nouveau projet',
      investisseur: 'optimisons votre stratégie',
      primo: 'réussissons votre première vente'
    };
    return subjects[persona];
  }

  private getPersonaCityExample(persona: GuidePersona): string {
    const cities = {
      presse: 'Bordeaux',
      maximisateur: 'Mérignac',
      succession: 'Pessac',
      nouvelle_vie: 'Talence',
      investisseur: 'Gradignan',
      primo: 'Bègles'
    };
    return cities[persona];
  }

  /**
   * Génère tous les templates pour toutes les personas
   */
  async generateAllTemplates(): Promise<{ success: boolean; created: number; errors: string[] }> {
    const personas: GuidePersona[] = ['presse', 'maximisateur', 'succession', 'nouvelle_vie', 'investisseur', 'primo'];
    const templates: TemplateConfig[] = [];
    const errors: string[] = [];
    let created = 0;

    // Générer tous les templates
    for (const persona of personas) {
      try {
        templates.push(this.generateGuideDeliveryTemplate(persona));
        templates.push(this.generateTipTemplate(persona));
        templates.push(this.generateCaseStudyTemplate(persona));
        templates.push(this.generateSoftOfferTemplate(persona));
      } catch (error) {
        errors.push(`Error generating templates for ${persona}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Sauvegarder en base de données
    for (const template of templates) {
      try {
        const templateData: InsertEmailTemplate = {
          name: template.name,
          subject: template.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent,
          category: template.category,
          isActive: true,
          variables: JSON.stringify(template.variables)
        };

        await storage.createEmailTemplate(templateData);
        created++;
        console.log(`✅ Created template: ${template.name}`);
      } catch (error) {
        errors.push(`Error saving template ${template.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      created,
      errors
    };
  }
}

export const emailTemplateGenerator = new EmailTemplateGenerator();
export default emailTemplateGenerator;