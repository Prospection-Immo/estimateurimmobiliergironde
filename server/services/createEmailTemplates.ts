import { storage } from "../storage";
import type { InsertEmailTemplate } from "@shared/schema";

/**
 * Service to create optimized email templates with conversion-focused "magic words":
 * 1. Vous - personalization
 * 2. Nouveau - novelty  
 * 3. Solution - problem-solving
 * 4. Gagner - opportunity
 * 5. Garantie - trust/guarantee
 * 6. Économie - savings
 * 7. Exclusif - exclusivity
 * 8. Gratuit - free
 * 9. Résultat - concrete results
 */

export async function createOptimizedEmailTemplates(): Promise<void> {
  const templates: InsertEmailTemplate[] = [
    // 1. Contact Confirmation Template
    {
      name: "Confirmation de Contact - Optimisée",
      subject: "✅ Votre demande reçue - Solution GRATUITE en préparation",
      category: "contact_confirmation",
      htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre demande a été reçue</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .highlight { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
        .highlight strong { color: #1d4ed8; }
        .guarantee-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; }
        .guarantee-box h3 { margin: 0 0 10px; font-size: 20px; }
        .next-steps { background: #f1f5f9; padding: 25px; border-radius: 12px; margin: 30px 0; }
        .next-steps h3 { color: #1e293b; margin: 0 0 15px; font-size: 18px; }
        .next-steps ol { margin: 0; padding-left: 20px; }
        .next-steps li { margin: 8px 0; color: #475569; }
        .cta-button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
        .footer p { margin: 5px 0; }
        .magic-word { color: #2563eb; font-weight: 600; }
        .underline { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Estimation Gironde</h1>
            <p><span class="magic-word">Votre</span> demande est entre nos mains expertes</p>
        </div>
        
        <div class="content">
            <h2>Bonjour {{firstName}},</h2>
            
            <p>Merci pour <span class="magic-word">votre</span> confiance ! <span class="magic-word">Votre</span> demande concernant "{{subject}}" a été reçue et notre équipe d'experts immobiliers prépare déjà une <span class="magic-word">solution</span> personnalisée pour <span class="magic-word">vous</span>.</p>
            
            <div class="highlight">
                <strong>📧 Récapitulatif de <span class="magic-word">votre</span> demande :</strong><br>
                <strong>Nom :</strong> {{firstName}} {{lastName}}<br>
                <strong>Email :</strong> {{email}}<br>
                {{#phone}}<strong>Téléphone :</strong> {{phone}}<br>{{/phone}}
                <strong>Sujet :</strong> {{subject}}<br>
                <strong>Message :</strong> {{message}}
            </div>
            
            <div class="guarantee-box">
                <h3>🛡️ <span class="magic-word">Garantie</span> de Réponse Rapide</h3>
                <p>Notre <span class="magic-word">nouvelle</span> approche <span class="magic-word">garantit</span> une réponse complète sous 24h ouvrées. <span class="magic-word">Votre</span> satisfaction est notre priorité absolue.</p>
            </div>
            
            <div class="next-steps">
                <h3>📋 <span class="magic-word">Résultats</span> attendus - Prochaines étapes :</h3>
                <ol>
                    <li>Analyse approfondie de <span class="magic-word">votre</span> demande par notre expert dédié</li>
                    <li>Préparation d'une <span class="magic-word">solution</span> sur-mesure <span class="magic-word">gratuite</span></li>
                    <li>Réponse détaillée avec des recommandations concrètes</li>
                    <li>Si applicable : proposition d'un entretien <span class="magic-word">gratuit</span> pour approfondir</li>
                </ol>
            </div>
            
            <p>En attendant, <span class="magic-word">vous</span> pouvez <span class="magic-word">gagner</span> du temps en consultant nos ressources <span class="magic-word">exclusives</span> :</p>
            
            <p style="text-align: center;">
                <a href="https://estimation-immobilier-gironde.fr/guides" class="cta-button">
                    🎯 Accéder à nos guides <span class="magic-word">GRATUITS</span>
                </a>
            </p>
            
            <p><strong>Notre engagement :</strong> <span class="magic-word">Vous</span> bénéficiez de notre <span class="magic-word">nouvelle</span> méthode d'accompagnement qui <span class="magic-word">garantit</span> des <span class="magic-word">résultats</span> concrets et vous fait <span class="magic-word">gagner</span> un temps précieux.</p>
            
            <p>Si <span class="magic-word">vous</span> avez des questions urgentes, n'hésitez pas à nous contacter directement.</p>
            
            <p>Cordialement,<br>
            <strong>L'équipe Estimation Gironde</strong><br>
            <em><span class="magic-word">Votre</span> partenaire immobilier de confiance</em></p>
        </div>
        
        <div class="footer">
            <p><strong>📞 Contact :</strong> 05 XX XX XX XX | <strong>📧 Email :</strong> contact@estimation-immobilier-gironde.fr</p>
            <p><strong>🌐 Site :</strong> estimation-immobilier-gironde.fr</p>
            <p>Expertise immobilière en Gironde - <span class="magic-word">Solutions</span> personnalisées <span class="magic-word">gratuites</span></p>
        </div>
    </div>
</body>
</html>`,
      textContent: `
ESTIMATION GIRONDE - Votre demande reçue

Bonjour {{firstName}},

Merci pour votre confiance ! Votre demande concernant "{{subject}}" a été reçue et notre équipe d'experts immobiliers prépare déjà une SOLUTION personnalisée pour vous.

📧 RÉCAPITULATIF DE VOTRE DEMANDE :
Nom : {{firstName}} {{lastName}}
Email : {{email}}
{{#phone}}Téléphone : {{phone}}{{/phone}}
Sujet : {{subject}}
Message : {{message}}

🛡️ GARANTIE DE RÉPONSE RAPIDE
Notre nouvelle approche garantit une réponse complète sous 24h ouvrées. Votre satisfaction est notre priorité absolue.

📋 RÉSULTATS ATTENDUS - Prochaines étapes :
1. Analyse approfondie de votre demande par notre expert dédié
2. Préparation d'une solution sur-mesure GRATUITE
3. Réponse détaillée avec des recommandations concrètes  
4. Si applicable : proposition d'un entretien gratuit pour approfondir

En attendant, vous pouvez GAGNER du temps en consultant nos ressources EXCLUSIVES sur :
https://estimation-immobilier-gironde.fr/guides

NOTRE ENGAGEMENT : Vous bénéficiez de notre nouvelle méthode d'accompagnement qui garantit des résultats concrets et vous fait gagner un temps précieux.

Si vous avez des questions urgentes, n'hésitez pas à nous contacter directement.

Cordialement,
L'équipe Estimation Gironde
Votre partenaire immobilier de confiance

📞 Contact : 05 XX XX XX XX
📧 Email : contact@estimation-immobilier-gironde.fr
🌐 Site : estimation-immobilier-gironde.fr

Expertise immobilière en Gironde - Solutions personnalisées gratuites
      `,
      isActive: true,
      variables: JSON.stringify([
        "firstName", "lastName", "email", "phone", "subject", "message"
      ])
    },

    // 2. Estimation Confirmation Template
    {
      name: "Confirmation d'Estimation - Optimisée",
      subject: "🎯 Votre estimation EXCLUSIVE - Résultat GRATUIT de {{estimatedValue}}€",
      category: "estimation_confirmation", 
      htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre estimation immobilière</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .estimation-result { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; padding: 30px; border-radius: 15px; text-align: center; margin: 30px 0; }
        .estimation-result h2 { color: #92400e; margin: 0 0 15px; font-size: 24px; }
        .price { font-size: 36px; font-weight: 700; color: #059669; margin: 15px 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
        .confidence { color: #92400e; font-weight: 600; }
        .property-details { background: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; }
        .property-details h3 { color: #1e293b; margin: 0 0 15px; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-row:last-child { border-bottom: none; }
        .guarantee-section { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 4px solid #2563eb; padding: 25px; margin: 30px 0; border-radius: 0 12px 12px 0; }
        .next-actions { background: #ecfdf5; border: 1px solid #10b981; padding: 25px; border-radius: 12px; margin: 30px 0; }
        .next-actions h3 { color: #065f46; margin: 0 0 15px; }
        .next-actions ul { margin: 0; padding-left: 20px; }
        .next-actions li { margin: 10px 0; color: #047857; }
        .cta-button { display: inline-block; background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 10px 10px 0; }
        .cta-secondary { background: #2563eb; }
        .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
        .magic-word { color: #059669; font-weight: 600; }
        .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 Estimation Gironde</h1>
            <p><span class="magic-word">Votre</span> estimation <span class="magic-word">exclusive</span> est prête !</p>
        </div>
        
        <div class="content">
            <h2>Félicitations {{firstName}} !</h2>
            
            <p><span class="magic-word">Votre</span> <span class="magic-word">nouveau</span> rapport d'estimation <span class="magic-word">gratuit</span> est maintenant disponible. Notre <span class="magic-word">solution</span> d'évaluation avancée a analysé <span class="magic-word">votre</span> bien avec la plus grande précision.</p>
            
            <div class="estimation-result">
                <h2>🎯 <span class="magic-word">Résultat</span> de <span class="magic-word">Votre</span> Estimation <span class="magic-word">Exclusive</span></h2>
                <div class="price">{{estimatedValue}}€</div>
                <p class="confidence">Confiance : {{confidence}}% • <span class="magic-word">Garantie</span> de précision</p>
                <p><strong>Prix au m² :</strong> {{pricePerM2}}€/m²</p>
            </div>
            
            <div class="property-details">
                <h3>📋 Détails de <span class="magic-word">Votre</span> Bien</h3>
                <div class="detail-row">
                    <span><strong>Type :</strong></span>
                    <span>{{propertyType}}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Adresse :</strong></span>
                    <span>{{address}}, {{city}}</span>
                </div>
                <div class="detail-row">
                    <span><strong>Surface :</strong></span>
                    <span>{{surface}} m²</span>
                </div>
                <div class="detail-row">
                    <span><strong>Propriétaire :</strong></span>
                    <span>{{firstName}} {{lastName}}</span>
                </div>
            </div>
            
            <div class="guarantee-section">
                <h3>🛡️ <span class="magic-word">Garantie</span> de Qualité</h3>
                <p>Cette estimation <span class="magic-word">exclusive</span> utilise notre <span class="magic-word">nouvelle</span> technologie d'analyse comparative qui <span class="magic-word">garantit</span> une précision maximale. <span class="magic-word">Vous</span> bénéficiez d'un <span class="magic-word">résultat</span> fiable basé sur les transactions récentes en Gironde.</p>
            </div>
            
            <div class="next-actions">
                <h3>🚀 Comment <span class="magic-word">Gagner</span> Plus avec Cette Estimation ?</h3>
                <ul>
                    <li><strong>Vente optimisée :</strong> Utilisez cette estimation pour <span class="magic-word">gagner</span> du temps et vendre au meilleur prix</li>
                    <li><strong><span class="magic-word">Économie</span> d'impôts :</strong> Optimisez <span class="magic-word">votre</span> fiscalité immobilière</li>
                    <li><strong>Refinancement :</strong> <span class="magic-word">Nouveau</span> crédit avec de meilleures conditions</li>
                    <li><strong>Assurance :</strong> Ajustez <span class="magic-word">votre</span> couverture pour faire des <span class="magic-word">économies</span></li>
                </ul>
            </div>
            
            <p style="text-align: center;">
                <a href="tel:05XXXXXXXX" class="cta-button">
                    📞 Conseil <span class="magic-word">GRATUIT</span> Expert
                </a>
                <a href="https://estimation-immobilier-gironde.fr/vendre" class="cta-button cta-secondary">
                    💰 <span class="magic-word">Gagner</span> Plus à la Vente
                </a>
            </p>
            
            <p><strong>Offre <span class="magic-word">exclusive</span> :</strong> <span class="magic-word">Vous</span> pouvez maintenant bénéficier d'un accompagnement <span class="magic-word">gratuit</span> pour <span class="magic-word">gagner</span> jusqu'à 15% de plus lors de <span class="magic-word">votre</span> vente. Cette <span class="magic-word">solution</span> <span class="magic-word">exclusive</span> est réservée aux propriétaires ayant reçu une estimation.</p>
            
            <p>Cette estimation <span class="magic-word">gratuite</span> est le premier pas vers de <span class="magic-word">nouveaux</span> <span class="magic-word">résultats</span> pour <span class="magic-word">votre</span> patrimoine immobilier.</p>
            
            <p>Cordialement,<br>
            <strong>L'équipe Estimation Gironde</strong><br>
            <em><span class="magic-word">Votre</span> expert immobilier en Gironde</em></p>
        </div>
        
        <div class="footer">
            <p><strong>📞 Contact :</strong> 05 XX XX XX XX | <strong>📧 Email :</strong> contact@estimation-immobilier-gironde.fr</p>
            <p>Estimations <span class="magic-word">gratuites</span> et <span class="magic-word">garanties</span> en Gironde</p>
        </div>
    </div>
</body>
</html>`,
      textContent: `
ESTIMATION GIRONDE - Votre estimation exclusive

Félicitations {{firstName}} !

Votre NOUVEAU rapport d'estimation GRATUIT est maintenant disponible. Notre SOLUTION d'évaluation avancée a analysé votre bien avec la plus grande précision.

🎯 RÉSULTAT DE VOTRE ESTIMATION EXCLUSIVE
{{estimatedValue}}€
Confiance : {{confidence}}% • GARANTIE de précision
Prix au m² : {{pricePerM2}}€/m²

📋 DÉTAILS DE VOTRE BIEN
Type : {{propertyType}}
Adresse : {{address}}, {{city}}
Surface : {{surface}} m²
Propriétaire : {{firstName}} {{lastName}}

🛡️ GARANTIE DE QUALITÉ
Cette estimation EXCLUSIVE utilise notre NOUVELLE technologie d'analyse comparative qui GARANTIT une précision maximale. Vous bénéficiez d'un RÉSULTAT fiable basé sur les transactions récentes en Gironde.

🚀 COMMENT GAGNER PLUS AVEC CETTE ESTIMATION ?
• Vente optimisée : Utilisez cette estimation pour GAGNER du temps et vendre au meilleur prix
• ÉCONOMIE d'impôts : Optimisez votre fiscalité immobilière  
• Refinancement : NOUVEAU crédit avec de meilleures conditions
• Assurance : Ajustez votre couverture pour faire des ÉCONOMIES

📞 CONSEIL GRATUIT EXPERT : 05 XX XX XX XX
💰 GAGNER PLUS À LA VENTE : estimation-immobilier-gironde.fr/vendre

OFFRE EXCLUSIVE : Vous pouvez maintenant bénéficier d'un accompagnement GRATUIT pour GAGNER jusqu'à 15% de plus lors de votre vente. Cette SOLUTION EXCLUSIVE est réservée aux propriétaires ayant reçu une estimation.

Cette estimation GRATUITE est le premier pas vers de NOUVEAUX RÉSULTATS pour votre patrimoine immobilier.

Cordialement,
L'équipe Estimation Gironde
Votre expert immobilier en Gironde

📞 Contact : 05 XX XX XX XX
📧 Email : contact@estimation-immobilier-gironde.fr
Estimations gratuites et garanties en Gironde
      `,
      isActive: true,
      variables: JSON.stringify([
        "firstName", "lastName", "email", "phone", "propertyType", "address", "city", 
        "surface", "estimatedValue", "pricePerM2", "confidence"
      ])
    },

    // 3. Financing Confirmation Template
    {
      name: "Confirmation de Financement - Optimisée",
      subject: "💰 Votre NOUVEAU projet - Solution de financement EXCLUSIVE",
      category: "financing_confirmation",
      htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre demande de financement</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .project-summary { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; padding: 25px; border-radius: 12px; margin: 25px 0; }
        .project-summary h3 { color: #92400e; margin: 0 0 15px; }
        .highlight { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
        .benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
        .benefit-card { background: #f0fdf4; border: 1px solid #10b981; padding: 20px; border-radius: 8px; text-align: center; }
        .benefit-card h4 { color: #047857; margin: 0 0 10px; font-size: 16px; }
        .benefit-card p { margin: 0; color: #065f46; font-size: 14px; }
        .guarantee-box { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; }
        .next-steps { background: #fef7ff; border: 1px solid #a855f7; padding: 25px; border-radius: 12px; margin: 30px 0; }
        .next-steps h3 { color: #7c2d92; margin: 0 0 15px; }
        .next-steps ol { margin: 0; padding-left: 20px; }
        .next-steps li { margin: 10px 0; color: #86198f; }
        .cta-button { display: inline-block; background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 10px 10px 0; }
        .cta-secondary { background: #059669; }
        .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
        .magic-word { color: #7c3aed; font-weight: 600; }
        .amount { font-size: 24px; font-weight: 700; color: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💰 Estimation Gironde</h1>
            <p><span class="magic-word">Votre nouvelle</span> <span class="magic-word">solution</span> de financement</p>
        </div>
        
        <div class="content">
            <h2>Excellente nouvelle, {{firstName}} !</h2>
            
            <p><span class="magic-word">Votre nouveau</span> projet de financement pour <span class="amount">{{projectAmount}}</span> vient d'être pris en charge par notre équipe d'experts. <span class="magic-word">Vous</span> allez <span class="magic-word">gagner</span> un temps précieux grâce à notre <span class="magic-word">solution</span> <span class="magic-word">exclusive</span> d'accompagnement.</p>
            
            <div class="project-summary">
                <h3>📋 <span class="magic-word">Résumé</span> de <span class="magic-word">Votre Nouveau</span> Projet</h3>
                <p><strong>Demandeur :</strong> {{firstName}} {{lastName}}</p>
                <p><strong>Type de projet :</strong> {{financingProjectType}}</p>
                <p><strong>Montant :</strong> <span class="amount">{{projectAmount}}</span></p>
                <p><strong>Contact :</strong> {{email}}{{#phone}} • {{phone}}{{/phone}}</p>
            </div>
            
            <div class="highlight">
                <strong>🎯 <span class="magic-word">Votre</span> Avantage <span class="magic-word">Exclusif</span> :</strong><br>
                En tant que client privilégié, <span class="magic-word">vous</span> bénéficiez de notre <span class="magic-word">nouvelle</span> méthode qui <span class="magic-word">garantit</span> les meilleures conditions du marché et vous fait <span class="magic-word">gagner</span> des milliers d'euros.
            </div>
            
            <div class="benefits-grid">
                <div class="benefit-card">
                    <h4>💰 <span class="magic-word">Économie</span> Maximale</h4>
                    <p>Jusqu'à 30% d'<span class="magic-word">économie</span> sur <span class="magic-word">votre</span> financement</p>
                </div>
                <div class="benefit-card">
                    <h4>⚡ <span class="magic-word">Résultat</span> Rapide</h4>
                    <p>Réponse <span class="magic-word">garantie</span> sous 48h</p>
                </div>
                <div class="benefit-card">
                    <h4>🎁 Service <span class="magic-word">Gratuit</span></h4>
                    <p>Accompagnement complet sans frais</p>
                </div>
                <div class="benefit-card">
                    <h4>🏆 <span class="magic-word">Exclusif</span></h4>
                    <p>Accès aux meilleures offres du marché</p>
                </div>
            </div>
            
            <div class="guarantee-box">
                <h3>🛡️ <span class="magic-word">Garantie</span> de <span class="magic-word">Résultat</span></h3>
                <p>Notre <span class="magic-word">solution</span> <span class="magic-word">exclusive</span> <span class="magic-word">garantit</span> que <span class="magic-word">vous</span> obtiendrez les meilleures conditions possibles ou nous continuons <span class="magic-word">gratuitement</span> jusqu'au <span class="magic-word">résultat</span>.</p>
            </div>
            
            <div class="next-steps">
                <h3>🚀 <span class="magic-word">Résultats</span> Attendus - <span class="magic-word">Votre</span> Plan d'Action</h3>
                <ol>
                    <li><strong>Analyse <span class="magic-word">gratuite</span> :</strong> Notre expert étudie <span class="magic-word">votre</span> dossier pour identifier les meilleures opportunités</li>
                    <li><strong>Négociation <span class="magic-word">exclusive</span> :</strong> Nous négocions avec nos partenaires pour <span class="magic-word">vous</span> faire <span class="magic-word">gagner</span> plus</li>
                    <li><strong><span class="magic-word">Solutions</span> sur-mesure :</strong> Présentation de 3-5 offres personnalisées</li>
                    <li><strong><span class="magic-word">Résultat</span> <span class="magic-word">garanti</span> :</strong> Finalisation de <span class="magic-word">votre nouveau</span> financement optimal</li>
                </ol>
            </div>
            
            <p style="text-align: center;">
                <a href="tel:05XXXXXXXX" class="cta-button">
                    📞 Expert <span class="magic-word">GRATUIT</span> Immédiat
                </a>
                <a href="https://estimation-immobilier-gironde.fr/financement" class="cta-button cta-secondary">
                    💰 <span class="magic-word">Gagner</span> Plus d'<span class="magic-word">Économies</span>
                </a>
            </p>
            
            <p><strong>Opportunité <span class="magic-word">exclusive</span> :</strong> Les propriétaires qui utilisent notre <span class="magic-word">solution</span> <span class="magic-word">gagnent</span> en moyenne 18 000€ sur leur financement et <span class="magic-word">économisent</span> 6 mois de démarches.</p>
            
            <p><span class="magic-word">Votre nouveau</span> financement optimisé est à portée de main. Notre équipe travaille déjà pour <span class="magic-word">vous</span> faire <span class="magic-word">gagner</span> plus.</p>
            
            <p>Cordialement,<br>
            <strong>L'équipe Estimation Gironde</strong><br>
            <em><span class="magic-word">Votre</span> expert financement en Gironde</em></p>
        </div>
        
        <div class="footer">
            <p><strong>📞 Contact :</strong> 05 XX XX XX XX | <strong>📧 Email :</strong> contact@estimation-immobilier-gironde.fr</p>
            <p><span class="magic-word">Solutions</span> de financement <span class="magic-word">exclusives</span> et <span class="magic-word">gratuites</span></p>
        </div>
    </div>
</body>
</html>`,
      textContent: `
ESTIMATION GIRONDE - Votre nouvelle solution de financement

Excellente nouvelle, {{firstName}} !

Votre NOUVEAU projet de financement pour {{projectAmount}} vient d'être pris en charge par notre équipe d'experts. Vous allez GAGNER un temps précieux grâce à notre SOLUTION EXCLUSIVE d'accompagnement.

📋 RÉSUMÉ DE VOTRE NOUVEAU PROJET
Demandeur : {{firstName}} {{lastName}}
Type de projet : {{financingProjectType}}
Montant : {{projectAmount}}
Contact : {{email}}{{#phone}} • {{phone}}{{/phone}}

🎯 VOTRE AVANTAGE EXCLUSIF :
En tant que client privilégié, vous bénéficiez de notre NOUVELLE méthode qui GARANTIT les meilleures conditions du marché et vous fait GAGNER des milliers d'euros.

BÉNÉFICES GARANTIS :
💰 ÉCONOMIE Maximale : Jusqu'à 30% d'ÉCONOMIE sur votre financement
⚡ RÉSULTAT Rapide : Réponse GARANTIE sous 48h
🎁 Service GRATUIT : Accompagnement complet sans frais
🏆 EXCLUSIF : Accès aux meilleures offres du marché

🛡️ GARANTIE DE RÉSULTAT
Notre SOLUTION EXCLUSIVE GARANTIT que vous obtiendrez les meilleures conditions possibles ou nous continuons GRATUITEMENT jusqu'au RÉSULTAT.

🚀 RÉSULTATS ATTENDUS - VOTRE PLAN D'ACTION
1. Analyse GRATUITE : Notre expert étudie votre dossier pour identifier les meilleures opportunités
2. Négociation EXCLUSIVE : Nous négocions avec nos partenaires pour vous faire GAGNER plus
3. SOLUTIONS sur-mesure : Présentation de 3-5 offres personnalisées
4. RÉSULTAT GARANTI : Finalisation de votre NOUVEAU financement optimal

📞 EXPERT GRATUIT IMMÉDIAT : 05 XX XX XX XX
💰 GAGNER PLUS D'ÉCONOMIES : estimation-immobilier-gironde.fr/financement

OPPORTUNITÉ EXCLUSIVE : Les propriétaires qui utilisent notre SOLUTION GAGNENT en moyenne 18 000€ sur leur financement et ÉCONOMISENT 6 mois de démarches.

Votre NOUVEAU financement optimisé est à portée de main. Notre équipe travaille déjà pour vous faire GAGNER plus.

Cordialement,
L'équipe Estimation Gironde
Votre expert financement en Gironde

📞 Contact : 05 XX XX XX XX
📧 Email : contact@estimation-immobilier-gironde.fr
Solutions de financement exclusives et gratuites
      `,
      isActive: true,
      variables: JSON.stringify([
        "firstName", "lastName", "email", "phone", "financingProjectType", "projectAmount"
      ])
    },

    // 4. Admin Notification Template
    {
      name: "Notification Admin - Optimisée",
      subject: "🔔 NOUVEAU lead - Résultat attendu pour {{leadType}}",
      category: "admin_notification",
      htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle demande client</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 25px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .alert-badge { display: inline-block; background: #ef4444; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
        .client-info { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .client-info h3 { color: #dc2626; margin: 0 0 15px; }
        .info-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; border-bottom: 1px dotted #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .priority-section { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .action-needed { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
        .action-needed h3 { margin: 0 0 10px; }
        .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat-item { background: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e2e8f0; }
        .stat-number { font-size: 18px; font-weight: 700; color: #dc2626; }
        .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        .magic-word { color: #dc2626; font-weight: 600; }
        .urgency { background: #fef2f2; border: 2px solid #ef4444; padding: 15px; border-radius: 8px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ ESTIMATION GIRONDE - ADMIN</h1>
            <p><span class="magic-word">Nouveau</span> lead à traiter - Action requise</p>
        </div>
        
        <div class="content">
            <div class="alert-badge">
                🚨 <span class="magic-word">NOUVEAU</span> LEAD {{currentTime}}
            </div>
            
            <h2>Demande de {{firstName}} {{lastName}}</h2>
            
            <div class="urgency">
                <strong>🎯 <span class="magic-word">Résultat</span> attendu :</strong> Contact client sous 2h pour maximiser les chances de conversion et offrir la meilleure <span class="magic-word">solution</span>.
            </div>
            
            <div class="client-info">
                <h3>👤 Informations Client</h3>
                <div class="info-row">
                    <span><strong>Nom complet :</strong></span>
                    <span>{{firstName}} {{lastName}}</span>
                </div>
                <div class="info-row">
                    <span><strong>Email :</strong></span>
                    <span>{{email}}</span>
                </div>
                {{#phone}}
                <div class="info-row">
                    <span><strong>Téléphone :</strong></span>
                    <span>{{phone}}</span>
                </div>
                {{/phone}}
                <div class="info-row">
                    <span><strong>Source :</strong></span>
                    <span>{{source}}</span>
                </div>
                <div class="info-row">
                    <span><strong>Date/Heure :</strong></span>
                    <span>{{currentDate}} à {{currentTime}}</span>
                </div>
            </div>
            
            {{#subject}}
            <div class="priority-section">
                <h3>📧 Sujet de la demande</h3>
                <p><strong>{{subject}}</strong></p>
                {{#message}}<p>Message : {{message}}</p>{{/message}}
            </div>
            {{/subject}}
            
            {{#propertyType}}
            <div class="priority-section">
                <h3>🏠 Détails de l'estimation</h3>
                <p><strong>Type :</strong> {{propertyType}}</p>
                <p><strong>Adresse :</strong> {{address}}, {{city}}</p>
                <p><strong>Surface :</strong> {{surface}} m²</p>
                {{#estimatedValue}}<p><strong>Valeur estimée :</strong> {{estimatedValue}}€</p>{{/estimatedValue}}
            </div>
            {{/propertyType}}
            
            {{#financingProjectType}}
            <div class="priority-section">
                <h3>💰 Projet de financement</h3>
                <p><strong>Type :</strong> {{financingProjectType}}</p>
                <p><strong>Montant :</strong> {{projectAmount}}</p>
            </div>
            {{/financingProjectType}}
            
            <div class="action-needed">
                <h3>🚀 Action Immédiate Requise</h3>
                <p>Ce <span class="magic-word">nouveau</span> lead nécessite un suivi prioritaire pour <span class="magic-word">garantir</span> le meilleur <span class="magic-word">résultat</span> de conversion.</p>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number">⏱️</div>
                    <div class="stat-label">Contact dans 2h max</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">🎯</div>
                    <div class="stat-label"><span class="magic-word">Solution</span> personnalisée</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">💰</div>
                    <div class="stat-label">Conversion optimale</div>
                </div>
            </div>
            
            <div class="priority-section">
                <h3>📋 Actions recommandées</h3>
                <ul>
                    <li><strong>Immédiat :</strong> Appel téléphonique pour établir le contact</li>
                    <li><strong>Dans l'heure :</strong> Email personnalisé avec <span class="magic-word">solution</span> adaptée</li>
                    <li><strong>J+1 :</strong> Suivi pour <span class="magic-word">garantir</span> la satisfaction</li>
                    <li><strong>J+7 :</strong> Relance pour <span class="magic-word">nouveau</span> besoin potentiel</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>🏠 <strong>Estimation Gironde</strong> - Système de notification automatique</p>
            <p><span class="magic-word">Nouveaux</span> leads traités avec <span class="magic-word">garantie</span> de <span class="magic-word">résultat</span></p>
        </div>
    </div>
</body>
</html>`,
      textContent: `
ESTIMATION GIRONDE - ADMIN NOTIFICATION

🚨 NOUVEAU LEAD {{currentTime}} - ACTION REQUISE

Demande de {{firstName}} {{lastName}}

🎯 RÉSULTAT ATTENDU : Contact client sous 2h pour maximiser les chances de conversion et offrir la meilleure SOLUTION.

👤 INFORMATIONS CLIENT
Nom complet : {{firstName}} {{lastName}}
Email : {{email}}
{{#phone}}Téléphone : {{phone}}{{/phone}}
Source : {{source}}
Date/Heure : {{currentDate}} à {{currentTime}}

{{#subject}}
📧 SUJET DE LA DEMANDE
{{subject}}
{{#message}}Message : {{message}}{{/message}}
{{/subject}}

{{#propertyType}}
🏠 DÉTAILS DE L'ESTIMATION
Type : {{propertyType}}
Adresse : {{address}}, {{city}}
Surface : {{surface}} m²
{{#estimatedValue}}Valeur estimée : {{estimatedValue}}€{{/estimatedValue}}
{{/propertyType}}

{{#financingProjectType}}
💰 PROJET DE FINANCEMENT
Type : {{financingProjectType}}
Montant : {{projectAmount}}
{{/financingProjectType}}

🚀 ACTION IMMÉDIATE REQUISE
Ce NOUVEAU lead nécessite un suivi prioritaire pour GARANTIR le meilleur RÉSULTAT de conversion.

OBJECTIFS :
⏱️ Contact dans 2h max
🎯 SOLUTION personnalisée  
💰 Conversion optimale

📋 ACTIONS RECOMMANDÉES
• Immédiat : Appel téléphonique pour établir le contact
• Dans l'heure : Email personnalisé avec SOLUTION adaptée
• J+1 : Suivi pour GARANTIR la satisfaction
• J+7 : Relance pour NOUVEAU besoin potentiel

🏠 Estimation Gironde - Système de notification automatique
NOUVEAUX leads traités avec GARANTIE de RÉSULTAT
      `,
      isActive: true,
      variables: JSON.stringify([
        "firstName", "lastName", "email", "phone", "subject", "message", 
        "propertyType", "address", "city", "surface", "estimatedValue", "pricePerM2",
        "financingProjectType", "projectAmount", "source", "currentDate", "currentTime", "leadType"
      ])
    }
  ];

  console.log('🚀 Creating optimized email templates with magic words...');
  
  for (const template of templates) {
    try {
      await storage.createEmailTemplate(template);
      console.log(`✅ Created template: ${template.name}`);
    } catch (error) {
      console.error(`❌ Error creating template ${template.name}:`, error);
    }
  }
  
  console.log('🎉 All optimized email templates created successfully!');
}

export async function checkEmailTemplatesStatus(): Promise<void> {
  console.log('📊 Checking email templates status...');
  
  const categories = ['contact_confirmation', 'estimation_confirmation', 'financing_confirmation', 'admin_notification'];
  
  for (const category of categories) {
    try {
      const templates = await storage.getEmailTemplates(category);
      console.log(`📧 ${category}: ${templates.length} templates found`);
      
      if (templates.length > 0) {
        const active = templates.filter(t => t.isActive).length;
        console.log(`   - Active: ${active}/${templates.length}`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${category}:`, error);
    }
  }
}