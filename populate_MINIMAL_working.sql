-- SCRIPT MINIMAL - SEULEMENT LES TABLES QUI FONCTIONNENT
-- On évite les tables problématiques pour commencer

-- 1. PERSONA CONFIGS (Fonctionne)
INSERT INTO persona_configs (persona, label, description, psych_profile, pain_points, motivations, communication_style, preferred_channels, primary_color, secondary_color, icon, keywords) VALUES
('presse', 'Acheteur Pressé', 'Personne qui veut vendre rapidement', 'Impatient, orienté résultats, recherche efficacité', 
 ARRAY['Temps limité', 'Stress financier', 'Déménagement urgent'], 
 ARRAY['Vente rapide', 'Simplicité', 'Gain de temps'],
 'Direct et concis', ARRAY['SMS', 'Téléphone', 'Email'], 
 '#FF5722', '#FF8A65', 'clock', ARRAY['rapide', 'urgent', 'vite']),

('maximisateur', 'Maximisateur de Prix', 'Propriétaire qui veut le meilleur prix', 'Analytique, méfiant, perfectionniste',
 ARRAY['Peur de mal vendre', 'Comparaisons constantes', 'Indécision'], 
 ARRAY['Prix maximum', 'Sécurité', 'Validation'],
 'Détaillé avec preuves', ARRAY['Email', 'Documentation', 'Rapports'], 
 '#4CAF50', '#81C784', 'trending-up', ARRAY['prix', 'valeur', 'estimation']),

('prudent', 'Vendeur Prudent', 'Personne qui prend son temps pour décider', 'Conservateur, réfléchi, sécuritaire',
 ARRAY['Peur de se tromper', 'Manque d''information', 'Pression familiale'], 
 ARRAY['Sécurité', 'Conseils experts', 'Processus clair'],
 'Rassurant et éducatif', ARRAY['Email', 'Guides', 'Consultations'], 
 '#2196F3', '#64B5F6', 'shield', ARRAY['sécurisé', 'conseils', 'guide']),

('investisseur', 'Investisseur Immobilier', 'Professionnel de l''investissement', 'Rationnel, orienté ROI, expérimenté',
 ARRAY['Rentabilité insuffisante', 'Complexité fiscale', 'Temps de gestion'], 
 ARRAY['Rentabilité', 'Optimisation fiscale', 'Portfolio'],
 'Technique et chiffré', ARRAY['Email', 'Rapports', 'Outils'], 
 '#9C27B0', '#BA68C8', 'briefcase', ARRAY['investissement', 'rentabilité', 'ROI']);

-- 2. EMAIL TEMPLATES (Fonctionne)
INSERT INTO email_templates (name, subject, html_content, text_content, category, variables) VALUES
('welcome_estimation', 'Votre estimation immobilière est prête !', 
 '<h2>Bonjour {{firstName}},</h2><p>Votre estimation pour {{address}} est terminée.</p><p>Valeur estimée: <strong>{{estimatedValue}}€</strong></p><p>Découvrez le rapport complet en pièce jointe.</p>',
 'Bonjour {{firstName}}, Votre estimation pour {{address}} est terminée. Valeur estimée: {{estimatedValue}}€',
 'estimation', '["firstName", "address", "estimatedValue"]'),

('guide_download_confirmation', 'Votre guide "{{guideTitle}}" est disponible', 
 '<h2>Merci {{firstName}} !</h2><p>Votre guide <strong>{{guideTitle}}</strong> est en pièce jointe.</p><p>Ce guide contient des conseils exclusifs pour {{persona}}.</p>',
 'Merci {{firstName}} ! Votre guide {{guideTitle}} est en pièce jointe.',
 'guide', '["firstName", "guideTitle", "persona"]'),

('follow_up_1', 'Des questions sur votre estimation ?', 
 '<h2>Bonjour {{firstName}},</h2><p>J''espère que votre estimation vous a été utile.</p><p>Avez-vous des questions sur la valeur de {{address}} ?</p>',
 'Bonjour {{firstName}}, J''espère que votre estimation vous a été utile. Avez-vous des questions ?',
 'follow_up', '["firstName", "address"]');

-- 3. SCORING CONFIG (Fonctionne)
INSERT INTO scoring_config (criteria_type, weight, rules, description) VALUES
('budget', 25, '{"budget_declared": {"500k+": 25, "300-500k": 20, "200-300k": 15, "100-200k": 10, "<100k": 5}}', 'Budget déclaré par le prospect'),
('budget', 25, '{"urgency": {"Très urgent": 25, "Urgent": 20, "Modéré": 15, "Pas urgent": 10, "Aucune": 5}}', 'Urgence financière du prospect'),
('authority', 25, '{"decision_maker": {"Propriétaire unique": 25, "Copropriétaire décideur": 20, "Copropriétaire": 15, "Mandataire": 10, "Autre": 5}}', 'Pouvoir de décision du prospect'),
('authority', 25, '{"family_situation": {"Célibataire": 25, "Couple uni": 20, "Couple séparé": 15, "Succession": 10, "Indivision": 5}}', 'Situation familiale du prospect'),
('need', 25, '{"motivation": {"Déménagement professionnel": 25, "Changement familial": 20, "Investissement": 15, "Opportunité": 10, "Curiosité": 5}}', 'Motivation de vente du prospect'),
('need', 25, '{"current_situation": {"Logement inadapté": 25, "Contraintes financières": 20, "Opportunité marché": 15, "Projet vie": 10, "Autre": 5}}', 'Situation actuelle du prospect'),
('timeline', 25, '{"desired_delay": {"<3 mois": 25, "3-6 mois": 20, "6-12 mois": 15, "1-2 ans": 10, ">2 ans": 5}}', 'Délai souhaité pour la vente'),
('timeline', 25, '{"availability": {"Immédiate": 25, "Cette semaine": 20, "Ce mois": 15, "Flexible": 10, "Limitée": 5}}', 'Disponibilité pour les visites');

-- Message de confirmation (seulement les tables qui marchent)
SELECT 
  'DONNÉES ESSENTIELLES AJOUTÉES ! ✅' as status,
  'Les fonctionnalités principales sont maintenant opérationnelles' as message,
  (SELECT COUNT(*) FROM persona_configs) as personas_created,
  (SELECT COUNT(*) FROM email_templates) as email_templates_created,
  (SELECT COUNT(*) FROM scoring_config) as scoring_rules_created;