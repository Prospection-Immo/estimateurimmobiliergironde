import { storage } from '../storage';
import emailService from './emailService';
import type { 
  Guide, 
  GuidePersona, 
  InsertGuideEmailSequence, 
  GuideEmailSequence,
  EmailTemplate 
} from '@shared/schema';

interface SequenceConfig {
  persona: GuidePersona;
  steps: Array<{
    dayOffset: number; // 0, 2, 5, 10
    emailType: 'guide_delivery' | 'tip' | 'case_study' | 'soft_offer';
    templateCategory: string;
  }>;
}

interface TriggerSequenceOptions {
  guideId: string; // Guide database ID, not slug
  leadEmail: string;
  leadFirstName: string;
  leadCity?: string;
  persona: GuidePersona;
  source?: string;
}

class EmailSequenceService {
  private static instance: EmailSequenceService;
  private sequenceConfigs: SequenceConfig[];
  private schedulerInterval: NodeJS.Timeout | null = null;
  private isSchedulerRunning = false;

  private constructor() {
    this.sequenceConfigs = this.initializeSequenceConfigs();
    this.startScheduler();
  }

  static getInstance(): EmailSequenceService {
    if (!EmailSequenceService.instance) {
      EmailSequenceService.instance = new EmailSequenceService();
    }
    return EmailSequenceService.instance;
  }

  private initializeSequenceConfigs(): SequenceConfig[] {
    return [
      {
        persona: 'presse',
        steps: [
          { dayOffset: 0, emailType: 'guide_delivery', templateCategory: 'guide_delivery_presse' },
          { dayOffset: 2, emailType: 'tip', templateCategory: 'tip_presse' },
          { dayOffset: 5, emailType: 'case_study', templateCategory: 'case_study_presse' },
          { dayOffset: 10, emailType: 'soft_offer', templateCategory: 'soft_offer_presse' }
        ]
      },
      {
        persona: 'maximisateur',
        steps: [
          { dayOffset: 0, emailType: 'guide_delivery', templateCategory: 'guide_delivery_maximisateur' },
          { dayOffset: 2, emailType: 'tip', templateCategory: 'tip_maximisateur' },
          { dayOffset: 5, emailType: 'case_study', templateCategory: 'case_study_maximisateur' },
          { dayOffset: 10, emailType: 'soft_offer', templateCategory: 'soft_offer_maximisateur' }
        ]
      },
      {
        persona: 'succession',
        steps: [
          { dayOffset: 0, emailType: 'guide_delivery', templateCategory: 'guide_delivery_succession' },
          { dayOffset: 2, emailType: 'tip', templateCategory: 'tip_succession' },
          { dayOffset: 5, emailType: 'case_study', templateCategory: 'case_study_succession' },
          { dayOffset: 10, emailType: 'soft_offer', templateCategory: 'soft_offer_succession' }
        ]
      },
      {
        persona: 'nouvelle_vie',
        steps: [
          { dayOffset: 0, emailType: 'guide_delivery', templateCategory: 'guide_delivery_nouvelle_vie' },
          { dayOffset: 2, emailType: 'tip', templateCategory: 'tip_nouvelle_vie' },
          { dayOffset: 5, emailType: 'case_study', templateCategory: 'case_study_nouvelle_vie' },
          { dayOffset: 10, emailType: 'soft_offer', templateCategory: 'soft_offer_nouvelle_vie' }
        ]
      },
      {
        persona: 'investisseur',
        steps: [
          { dayOffset: 0, emailType: 'guide_delivery', templateCategory: 'guide_delivery_investisseur' },
          { dayOffset: 2, emailType: 'tip', templateCategory: 'tip_investisseur' },
          { dayOffset: 5, emailType: 'case_study', templateCategory: 'case_study_investisseur' },
          { dayOffset: 10, emailType: 'soft_offer', templateCategory: 'soft_offer_investisseur' }
        ]
      },
      {
        persona: 'primo',
        steps: [
          { dayOffset: 0, emailType: 'guide_delivery', templateCategory: 'guide_delivery_primo' },
          { dayOffset: 2, emailType: 'tip', templateCategory: 'tip_primo' },
          { dayOffset: 5, emailType: 'case_study', templateCategory: 'case_study_primo' },
          { dayOffset: 10, emailType: 'soft_offer', templateCategory: 'soft_offer_primo' }
        ]
      }
    ];
  }

  /**
   * Déclenche une séquence email complète pour un lead
   */
  async triggerSequence(options: TriggerSequenceOptions): Promise<{ success: boolean; sequenceIds: string[]; error?: string }> {
    try {
      const { guideId, leadEmail, leadFirstName, leadCity, persona, source } = options;

      // Vérifier si une séquence existe déjà pour ce lead et ce guide (déduplication corrigée)
      const existingSequences = await storage.getGuideEmailSequences(leadEmail);
      const hasExistingSequence = existingSequences.some(seq => 
        seq.guideId === guideId && seq.persona === persona && 
        (seq.status === 'scheduled' || seq.status === 'sent')
      );

      if (hasExistingSequence) {
        console.log(`Sequence already exists for ${leadEmail} - guide ${guideId} - persona ${persona}`);
        return { success: false, sequenceIds: [], error: 'Sequence already exists' };
      }

      // Récupérer la configuration pour cette persona
      const config = this.sequenceConfigs.find(c => c.persona === persona);
      if (!config) {
        throw new Error(`No sequence configuration found for persona: ${persona}`);
      }

      // Récupérer les informations du guide par ID
      const guide = await storage.getGuideById(guideId);
      if (!guide) {
        throw new Error(`Guide not found with ID: ${guideId}`);
      }

      // Créer les séquences email pour tous les steps
      const sequenceIds: string[] = [];
      const now = new Date();

      for (const step of config.steps) {
        const scheduledFor = new Date(now);
        scheduledFor.setDate(scheduledFor.getDate() + step.dayOffset);

        const sequenceData: InsertGuideEmailSequence = {
          guideId: guide.id,
          leadEmail,
          leadFirstName, // Store actual lead first name
          leadCity: leadCity || 'Non spécifiée', // Store actual lead city
          persona,
          sequenceStep: step.dayOffset,
          emailType: step.emailType,
          scheduledFor,
          status: 'scheduled'
        };

        const sequence = await storage.createGuideEmailSequence(sequenceData);
        sequenceIds.push(sequence.id);

        console.log(`Created email sequence: ${step.emailType} for ${persona} - scheduled for ${scheduledFor.toISOString()}`);
      }

      // Déclencher immédiatement le premier email (guide_delivery)
      await this.processScheduledEmails();

      return { success: true, sequenceIds };
    } catch (error) {
      console.error('Error triggering email sequence:', error);
      return { 
        success: false, 
        sequenceIds: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Traite les emails programmés qui doivent être envoyés maintenant
   */
  async processScheduledEmails(): Promise<{ sent: number; failed: number }> {
    try {
      const now = new Date();
      
      // Récupérer toutes les séquences programmées qui doivent être envoyées
      const allSequences = await storage.getGuideEmailSequences();
      const pendingSequences = allSequences.filter(sequence => 
        sequence.status === 'scheduled' && 
        sequence.scheduledFor <= now
      );

      console.log(`Processing ${pendingSequences.length} scheduled emails`);

      let sent = 0;
      let failed = 0;

      for (const sequence of pendingSequences) {
        try {
          const success = await this.sendSequenceEmail(sequence);
          if (success) {
            sent++;
            await storage.updateGuideEmailSequence(sequence.id, {
              status: 'sent',
              sentAt: new Date()
            });
          } else {
            failed++;
            await storage.updateGuideEmailSequence(sequence.id, {
              status: 'failed'
            });
          }
        } catch (error) {
          console.error(`Error sending sequence email ${sequence.id}:`, error);
          failed++;
          await storage.updateGuideEmailSequence(sequence.id, {
            status: 'failed'
          });
        }
      }

      console.log(`Email processing complete: ${sent} sent, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('Error processing scheduled emails:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Envoie un email de séquence spécifique
   */
  private async sendSequenceEmail(sequence: GuideEmailSequence): Promise<boolean> {
    try {
      // Construire la catégorie du template
      const templateCategory = `${sequence.emailType}_${sequence.persona}`;
      
      // Récupérer le template
      const templates = await storage.getEmailTemplates();
      const template = templates.find(t => t.category === templateCategory && t.isActive);
      
      if (!template) {
        console.error(`No active template found for category: ${templateCategory}`);
        return false;
      }

      // Récupérer les informations du guide par ID
      const guide = await storage.getGuideById(sequence.guideId);
      if (!guide) {
        console.error(`Guide not found with ID: ${sequence.guideId}`);
        return false;
      }

      // Préparer les variables pour le template avec vraies données lead
      const variables = {
        firstName: sequence.leadFirstName || this.extractFirstNameFromEmail(sequence.leadEmail),
        city: sequence.leadCity || 'votre région',
        email: sequence.leadEmail,
        guideTitle: guide.title,
        guideSlug: guide.slug,
        persona: sequence.persona,
        unsubscribeLink: this.generateUnsubscribeLink(sequence.leadEmail, sequence.id),
        sequenceStep: sequence.sequenceStep,
        currentYear: new Date().getFullYear().toString()
      };

      // Envoyer l'email
      const result = await emailService.sendTemplatedEmail(
        template,
        variables,
        sequence.leadEmail,
        variables.firstName
      );

      if (result.success) {
        console.log(`Successfully sent ${sequence.emailType} email to ${sequence.leadEmail}`);
        
        // Enregistrer l'historique si disponible
        if (result.emailHistory) {
          await storage.createEmailHistory(result.emailHistory);
        }
        
        return true;
      } else {
        console.error(`Failed to send email: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error in sendSequenceEmail:', error);
      return false;
    }
  }

  /**
   * Extrait le prénom de l'email ou retourne un nom par défaut
   */
  private extractFirstNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    const name = localPart.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Génère un lien de désabonnement sécurisé
   */
  private generateUnsubscribeLink(email: string, sequenceId: string): string {
    const baseUrl = process.env.VITE_APP_URL || 'https://estimation-immobilier-gironde.fr';
    const token = Buffer.from(`${email}:${sequenceId}`).toString('base64');
    return `${baseUrl}/unsubscribe?token=${token}`;
  }

  /**
   * Désabonne un utilisateur de toutes les séquences
   */
  async unsubscribeUser(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sequences = await storage.getGuideEmailSequences(email);
      const activeSequences = sequences.filter(s => s.status === 'scheduled');

      for (const sequence of activeSequences) {
        await storage.updateGuideEmailSequence(sequence.id, {
          status: 'cancelled'
        });
      }

      console.log(`Unsubscribed ${email} from ${activeSequences.length} sequences`);
      return { success: true };
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Obtient les statistiques des séquences
   */
  async getSequenceStats(): Promise<{
    totalSequences: number;
    scheduled: number;
    sent: number;
    failed: number;
    cancelled: number;
    byPersona: Record<GuidePersona, number>;
  }> {
    try {
      const allSequences = await storage.getGuideEmailSequences();
      
      const stats = {
        totalSequences: allSequences.length,
        scheduled: 0,
        sent: 0,
        failed: 0,
        cancelled: 0,
        byPersona: {
          presse: 0,
          maximisateur: 0,
          succession: 0,
          nouvelle_vie: 0,
          investisseur: 0,
          primo: 0
        } as Record<GuidePersona, number>
      };

      for (const sequence of allSequences) {
        // Compter par statut
        switch (sequence.status) {
          case 'scheduled':
            stats.scheduled++;
            break;
          case 'sent':
            stats.sent++;
            break;
          case 'failed':
            stats.failed++;
            break;
          case 'cancelled':
            stats.cancelled++;
            break;
        }

        // Compter par persona
        if (sequence.persona && sequence.persona in stats.byPersona) {
          stats.byPersona[sequence.persona as GuidePersona]++;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting sequence stats:', error);
      return {
        totalSequences: 0,
        scheduled: 0,
        sent: 0,
        failed: 0,
        cancelled: 0,
        byPersona: {
          presse: 0,
          maximisateur: 0,
          succession: 0,
          nouvelle_vie: 0,
          investisseur: 0,
          primo: 0
        }
      };
    }
  }

  /**
   * Démarre le scheduler automatique pour traiter les emails programmés
   */
  private startScheduler(intervalMinutes: number = 15): void {
    if (this.isSchedulerRunning) {
      console.log('Email scheduler is already running');
      return;
    }

    console.log(`Starting automatic email sequence scheduler (every ${intervalMinutes} minutes)`);
    this.isSchedulerRunning = true;
    
    // Traitement initial après 30 secondes (laisser le temps au système de démarrer)
    setTimeout(async () => {
      console.log('Running initial email sequence processing...');
      await this.processScheduledEmails();
    }, 30000);
    
    // Traitement périodique toutes les 15 minutes
    this.schedulerInterval = setInterval(async () => {
      console.log('Running scheduled email sequence processing...');
      try {
        const result = await this.processScheduledEmails();
        if (result.sent > 0 || result.failed > 0) {
          console.log(`Email processing completed: ${result.sent} sent, ${result.failed} failed`);
        }
      } catch (error) {
        console.error('Error in scheduled email processing:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Arrête le scheduler automatique
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      this.isSchedulerRunning = false;
      console.log('Email sequence scheduler stopped');
    }
  }

  /**
   * Méthode utilitaire pour démarrer le processeur en arrière-plan (obsolète - utiliser startScheduler)
   * @deprecated Use the automatic scheduler in constructor instead
   */
  startBackgroundProcessor(intervalMinutes: number = 30): void {
    console.log('Warning: startBackgroundProcessor is deprecated. The scheduler is now automatic.');
    // Ne pas démarrer un deuxième scheduler
  }
}

export const emailSequenceService = EmailSequenceService.getInstance();
export default emailSequenceService;