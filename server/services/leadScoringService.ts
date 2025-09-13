import { storage } from "../storage";
import type { Lead, LeadScoring, ScoringConfig, InsertLeadScoring, InsertLeadScoreHistory } from "@shared/schema";

// BANT Methodology Lead Scoring Service
export class LeadScoringService {
  
  // Initialize default scoring configuration
  async initializeDefaultConfig(): Promise<void> {
    const existingConfigs = await storage.getScoringConfigs();
    
    if (existingConfigs.length === 0) {
      // Create default BANT configuration
      const defaultConfigs = [
        {
          criteriaType: "budget",
          weight: 25,
          isActive: true,
          description: "Évaluation de la capacité financière selon la valeur estimée du bien",
          rules: JSON.stringify({
            ranges: [
              { min: 0, max: 150000, score: 10, label: "Budget limité" },
              { min: 150000, max: 300000, score: 15, label: "Budget modéré" },
              { min: 300000, max: 500000, score: 20, label: "Budget confortable" },
              { min: 500000, max: Infinity, score: 25, label: "Budget élevé" }
            ]
          }),
          thresholds: JSON.stringify({
            qualified: 15,
            hot_lead: 20
          }),
          bonusRules: JSON.stringify({
            hasPropertyEstimation: 5,
            hasDetailedEstimation: 3
          })
        },
        {
          criteriaType: "authority",
          weight: 25,
          isActive: true,
          description: "Niveau de pouvoir décisionnel dans la vente",
          rules: JSON.stringify({
            ownershipMapping: {
              "proprietaire_unique": 25,
              "coproprietaire_majoritaire": 20,
              "coproprietaire_egalitaire": 15,
              "heritier_principal": 18,
              "heritier_partage": 12,
              "mandataire": 8,
              "non_renseigne": 5
            }
          }),
          thresholds: JSON.stringify({
            qualified: 15,
            hot_lead: 20
          }),
          bonusRules: JSON.stringify({
            wantsExpertContact: 5,
            providedPhone: 2
          })
        },
        {
          criteriaType: "need",
          weight: 25,
          isActive: true,
          description: "Urgence et motivation de vente",
          rules: JSON.stringify({
            projectTypeMapping: {
              "vente_urgente": 25,
              "succession_rapide": 22,
              "mutation_professionnelle": 20,
              "optimisation_patrimoine": 18,
              "changement_familial": 15,
              "investissement": 12,
              "curiosite_prix": 5,
              "non_renseigne": 8
            }
          }),
          thresholds: JSON.stringify({
            qualified: 15,
            hot_lead: 20
          }),
          bonusRules: JSON.stringify({
            hasDocuments: 3,
            hasRenovationPlans: 2
          })
        },
        {
          criteriaType: "timeline",
          weight: 25,
          isActive: true,
          description: "Délai souhaité pour la vente",
          rules: JSON.stringify({
            timelineMapping: {
              "immediate": 25,
              "1_3_mois": 22,
              "3_6_mois": 18,
              "6_12_mois": 12,
              "plus_12_mois": 8,
              "non_renseigne": 10
            }
          }),
          thresholds: JSON.stringify({
            qualified: 15,
            hot_lead: 20
          }),
          bonusRules: JSON.stringify({
            hasExistingOffer: 5,
            marketConditionsFavorable: 3
          })
        }
      ];

      for (const config of defaultConfigs) {
        await storage.createScoringConfig(config);
      }
    }
  }

  // Calculate complete BANT score for a lead
  async calculateLeadScore(lead: Lead): Promise<{
    totalScore: number;
    budgetScore: number;
    authorityScore: number;
    needScore: number;
    timelineScore: number;
    confidenceLevel: number;
  }> {
    const configs = await storage.getScoringConfigs();
    const configMap = new Map(configs.map(c => [c.criteriaType, c]));

    // Calculate each BANT component
    const budgetScore = await this.calculateBudgetScore(lead, configMap.get("budget"));
    const authorityScore = await this.calculateAuthorityScore(lead, configMap.get("authority"));
    const needScore = await this.calculateNeedScore(lead, configMap.get("need"));
    const timelineScore = await this.calculateTimelineScore(lead, configMap.get("timeline"));

    // Apply weights and calculate total
    const totalScore = Math.min(100, Math.round(
      (budgetScore * (configMap.get("budget")?.weight || 25) / 25) +
      (authorityScore * (configMap.get("authority")?.weight || 25) / 25) +
      (needScore * (configMap.get("need")?.weight || 25) / 25) +
      (timelineScore * (configMap.get("timeline")?.weight || 25) / 25)
    ));

    // Calculate confidence level based on data completeness
    const confidenceLevel = this.calculateConfidenceLevel(lead);

    return {
      totalScore,
      budgetScore,
      authorityScore,
      needScore,
      timelineScore,
      confidenceLevel
    };
  }

  // Budget scoring (0-25 points)
  private async calculateBudgetScore(lead: Lead, config?: ScoringConfig): Promise<number> {
    if (!config) return 0;

    const rules = JSON.parse(config.rules || "{}");
    const bonusRules = JSON.parse(config.bonusRules || "{}");
    
    let score = 0;

    // Base score from estimated value
    if (lead.estimatedValue) {
      const value = parseFloat(lead.estimatedValue.toString());
      const range = rules.ranges?.find((r: any) => value >= r.min && value < r.max);
      score = range?.score || 10;
    } else {
      score = 8; // Default for no estimation
    }

    // Bonus points
    if (lead.estimatedValue && bonusRules.hasPropertyEstimation) {
      score += bonusRules.hasPropertyEstimation;
    }

    if (lead.surface && lead.rooms && bonusRules.hasDetailedEstimation) {
      score += bonusRules.hasDetailedEstimation;
    }

    return Math.min(25, score);
  }

  // Authority scoring (0-25 points)
  private async calculateAuthorityScore(lead: Lead, config?: ScoringConfig): Promise<number> {
    if (!config) return 0;

    const rules = JSON.parse(config.rules || "{}");
    const bonusRules = JSON.parse(config.bonusRules || "{}");
    
    let score = 0;

    // Base score from ownership status
    const ownershipStatus = lead.ownershipStatus || "non_renseigne";
    score = rules.ownershipMapping?.[ownershipStatus] || 5;

    // Bonus points
    if (lead.wantsExpertContact && bonusRules.wantsExpertContact) {
      score += bonusRules.wantsExpertContact;
    }

    if (lead.phone && bonusRules.providedPhone) {
      score += bonusRules.providedPhone;
    }

    return Math.min(25, score);
  }

  // Need scoring (0-25 points)
  private async calculateNeedScore(lead: Lead, config?: ScoringConfig): Promise<number> {
    if (!config) return 0;

    const rules = JSON.parse(config.rules || "{}");
    const bonusRules = JSON.parse(config.bonusRules || "{}");
    
    let score = 0;

    // Base score from project type
    const projectType = lead.projectType || "non_renseigne";
    score = rules.projectTypeMapping?.[projectType] || 8;

    // Bonus for lead type (more detailed leads show higher need)
    if (lead.leadType === "estimation_detailed") {
      score += 3;
    }

    return Math.min(25, score);
  }

  // Timeline scoring (0-25 points)
  private async calculateTimelineScore(lead: Lead, config?: ScoringConfig): Promise<number> {
    if (!config) return 0;

    const rules = JSON.parse(config.rules || "{}");
    const bonusRules = JSON.parse(config.bonusRules || "{}");
    
    let score = 0;

    // Base score from timeline
    const timeline = lead.timeline || lead.saleTimeline || "non_renseigne";
    score = rules.timelineMapping?.[timeline] || 10;

    // Bonus for immediate or short timeline
    if (timeline === "immediate" || timeline === "3m") {
      score += 2;
    }

    return Math.min(25, score);
  }

  // Calculate confidence level based on data completeness (0-100)
  private calculateConfidenceLevel(lead: Lead): number {
    let completeness = 0;
    let totalFields = 0;

    // Essential fields
    const essentialFields = [
      'email', 'firstName', 'lastName', 'propertyType', 
      'address', 'city', 'surface', 'rooms'
    ];

    essentialFields.forEach(field => {
      totalFields++;
      if (lead[field as keyof Lead]) completeness++;
    });

    // Optional but valuable fields
    const optionalFields = [
      'phone', 'bedrooms', 'bathrooms', 'constructionYear',
      'ownershipStatus', 'projectType', 'timeline'
    ];

    optionalFields.forEach(field => {
      totalFields++;
      if (lead[field as keyof Lead]) completeness++;
    });

    return Math.round((completeness / totalFields) * 100);
  }

  // Determine qualification status based on score
  determineQualificationStatus(totalScore: number): string {
    if (totalScore >= 76) return "hot_lead";
    if (totalScore >= 51) return "qualified";
    if (totalScore >= 26) return "to_review";
    return "unqualified";
  }

  // Create or update lead scoring
  async updateLeadScoring(
    leadId: string, 
    oldScoring?: LeadScoring, 
    reason: string = "automatic_calculation",
    changedBy: string = "system"
  ): Promise<LeadScoring> {
    // Get lead data
    const leads = await storage.getLeads();
    const lead = leads.find(l => l.id === leadId);
    
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    // Calculate new scores
    const scores = await this.calculateLeadScore(lead);
    const qualificationStatus = this.determineQualificationStatus(scores.totalScore);

    const scoringData: InsertLeadScoring = {
      leadId,
      totalScore: scores.totalScore,
      budgetScore: scores.budgetScore,
      authorityScore: scores.authorityScore,
      needScore: scores.needScore,
      timelineScore: scores.timelineScore,
      qualificationStatus,
      confidenceLevel: scores.confidenceLevel,
      manualAdjustment: oldScoring?.manualAdjustment || 0
    };

    let newScoring: LeadScoring;

    if (oldScoring) {
      // Update existing scoring
      newScoring = await storage.updateLeadScoring(leadId, scoringData);
      
      // Create history entry if score changed
      if (oldScoring.totalScore !== scores.totalScore) {
        await storage.createLeadScoreHistory({
          leadId,
          oldScore: oldScoring.totalScore,
          newScore: scores.totalScore,
          scoreChange: scores.totalScore - oldScoring.totalScore,
          changeReason: reason,
          changedBy,
          details: JSON.stringify({
            oldScores: {
              budget: oldScoring.budgetScore,
              authority: oldScoring.authorityScore,
              need: oldScoring.needScore,
              timeline: oldScoring.timelineScore
            },
            newScores: {
              budget: scores.budgetScore,
              authority: scores.authorityScore,
              need: scores.needScore,
              timeline: scores.timelineScore
            }
          })
        });
      }
    } else {
      // Create new scoring
      newScoring = await storage.createLeadScoring(scoringData);
      
      // Create initial history entry
      await storage.createLeadScoreHistory({
        leadId,
        oldScore: 0,
        newScore: scores.totalScore,
        scoreChange: scores.totalScore,
        changeReason: "initial_calculation",
        changedBy: "system",
        details: JSON.stringify({
          initialScores: {
            budget: scores.budgetScore,
            authority: scores.authorityScore,
            need: scores.needScore,
            timeline: scores.timelineScore
          }
        })
      });
    }

    return newScoring;
  }

  // Manual score adjustment
  async adjustLeadScore(
    leadId: string, 
    adjustment: number, 
    notes: string, 
    changedBy: string
  ): Promise<LeadScoring> {
    const existingScoring = await storage.getLeadScoring(leadId);
    
    if (!existingScoring) {
      throw new Error(`No scoring found for lead: ${leadId}`);
    }

    const newTotalScore = Math.max(0, Math.min(100, 
      existingScoring.totalScore + adjustment
    ));

    const newQualificationStatus = this.determineQualificationStatus(newTotalScore);

    const updatedScoring = await storage.updateLeadScoring(leadId, {
      totalScore: newTotalScore,
      qualificationStatus: newQualificationStatus,
      manualAdjustment: (existingScoring.manualAdjustment || 0) + adjustment,
      notes
    });

    // Create history entry
    await storage.createLeadScoreHistory({
      leadId,
      oldScore: existingScoring.totalScore,
      newScore: newTotalScore,
      scoreChange: adjustment,
      changeReason: "manual_adjustment",
      changedBy,
      details: JSON.stringify({
        adjustment,
        notes,
        oldQualification: existingScoring.qualificationStatus,
        newQualification: newQualificationStatus
      })
    });

    return updatedScoring;
  }

  // Recalculate all lead scores (useful after config changes)
  async recalculateAllScores(): Promise<{ updated: number; errors: string[] }> {
    const leads = await storage.getLeads();
    let updated = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      try {
        const existingScoring = await storage.getLeadScoring(lead.id);
        await this.updateLeadScoring(
          lead.id, 
          existingScoring, 
          "config_update", 
          "system"
        );
        updated++;
      } catch (error) {
        errors.push(`Failed to update lead ${lead.id}: ${error}`);
      }
    }

    return { updated, errors };
  }

  // Get scoring analytics
  async getScoringAnalytics(startDate?: Date, endDate?: Date) {
    const stats = await storage.getLeadScoringStats(startDate, endDate);
    const distribution = await storage.getScoreDistribution();
    const bantBreakdown = await storage.getBantBreakdown();

    return {
      overview: stats,
      scoreDistribution: distribution,
      bantBreakdown,
      recommendations: this.generateRecommendations(stats, distribution)
    };
  }

  // Generate recommendations based on scoring performance
  private generateRecommendations(
    stats: any, 
    distribution: any[]
  ): Array<{ type: string; description: string; impact: string }> {
    const recommendations = [];

    // Low qualification rate
    if (stats.qualificationRate < 30) {
      recommendations.push({
        type: "configuration",
        description: "Votre taux de qualification est faible. Considérez ajuster les seuils ou pondérations BANT.",
        impact: "Amélioration potentielle du ROI commercial"
      });
    }

    // High concentration in low scores
    const lowScorePercentage = distribution
      .filter(d => d.range === "0-25")
      .reduce((sum, d) => sum + d.percentage, 0);

    if (lowScorePercentage > 50) {
      recommendations.push({
        type: "lead_quality",
        description: "Plus de 50% de vos leads ont un score faible. Optimisez vos sources de leads.",
        impact: "Réduction des coûts d'acquisition"
      });
    }

    // Low average score
    if (stats.averageScore < 45) {
      recommendations.push({
        type: "process",
        description: "Score moyen faible. Enrichissez la qualification initiale des leads.",
        impact: "Meilleure priorisation commerciale"
      });
    }

    return recommendations;
  }
}

export const leadScoringService = new LeadScoringService();