import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import EmailSequenceManager from "@/components/EmailSequenceManager";
import AdminAnalyticsDashboard from "@/components/AdminAnalyticsDashboard";
import { AdminSidebar } from "@/components/AdminSidebar";
import { 
  Users, 
  User,
  Calculator, 
  Phone, 
  TrendingUp, 
  Search, 
  MoreHorizontal,
  Mail,
  MapPin,
  LogOut,
  AlertCircle,
  Eye,
  EyeOff,
  MessageSquare,
  Clock,
  FileText,
  Edit,
  Trash2,
  Plus,
  Wand2,
  Save,
  Globe,
  Calendar as CalendarIcon,
  ChevronDown,
  CheckCircle,
  Loader2,
  Send,
  Settings,
  History,
  TestTube,
  BarChart3,
  Filter,
  PieChart,
  Home,
  CreditCard,
  BookOpen,
  Star,
  UserCheck,
  Copy,
  Grid3X3,
  Download
} from "lucide-react";

import GuideForm from "@/components/GuideForm";
import LeadScoringDashboard from "@/components/LeadScoringDashboard";
import SmsCampaignsManager from "@/components/SmsCampaignsManager";
import type { 
  Lead, 
  Estimation, 
  Contact, 
  Article, 
  EmailTemplate, 
  EmailHistory, 
  Guide, 
  GuideDownload, 
  GuideAnalytics,
  InsertGuide
} from "@shared/schema";
import { GUIDE_PERSONAS } from "@shared/schema";

interface EstimationDisplay extends Estimation {
  lead?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    leadType: string;
  };
}

interface Stats {
  totalLeads: number;
  newLeads: number;
  estimationsToday: number;
  conversionRate: string;
  totalContacts: number;
}

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  sentToday: number;
  successRate: string;
}

interface GeneratedArticle {
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  summary: string;
  keywords: string[];
  category: string;
  seoElements: {
    title: string;
    description: string;
    slug: string;
  };
  visualElements?: {
    heroImageDescription: string;
    sectionImages: string[];
    pinterestIdeas: string[];
  };
}

interface AdminDashboardProps {
  domain?: string;
}

// Guide Personas Section - Interface complète de gestion des personas
interface PersonaConfig {
  id: string;
  label: string;
  description: string;
  psychProfile: string;
  painPoints: string[];
  motivations: string[];
  communicationStyle: string;
  preferredChannels: string[];
  colors: {
    primary: string;
    secondary: string;
  };
  icon: string;
  keywords: string[];
}

interface PersonaStats {
  persona: string;
  guidesCount: number;
  downloadsCount: number;
  leadsCount: number;
  conversionRate: number;
  avgReadTime: number;
  topGuide: string;
}

interface PersonaAnalytics {
  persona: string;
  weeklyGrowth: number;
  monthlyGrowth: number;
  revenue: number;
  ltv: number;
  leadQuality: number;
}

function GuidePersonasSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [personaConfigOpen, setPersonaConfigOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [editingPersona, setEditingPersona] = useState<PersonaConfig | null>(null);
  const [newGuideOpen, setNewGuideOpen] = useState(false);
  const [editGuideOpen, setEditGuideOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  // Configuration complète des personas
  const personaConfigs: Record<string, PersonaConfig> = {
    presse: {
      id: 'presse',
      label: 'Vendeur Pressé',
      description: 'Vendeur ayant une contrainte de temps forte, cherche des solutions rapides et efficaces',
      psychProfile: 'Pragmatique, orienté résultat, stress du temps, besoin de réassurance sur la rapidité',
      painPoints: [
        'Contrainte de temps serrée (mutation, divorce, urgence financière)',
        'Peur de ne pas vendre assez vite',
        'Stress lié aux démarches administratives',
        'Besoin de cash rapidement'
      ],
      motivations: [
        'Vendre dans les 3 mois maximum',
        'Éviter les complications',
        'Solution clé en main',
        'Transparence sur les délais'
      ],
      communicationStyle: 'Direct, concis, orienté action avec deadlines claires',
      preferredChannels: ['SMS', 'Email', 'Appel téléphonique'],
      colors: {
        primary: '#ef4444', // Rouge urgence
        secondary: '#fca5a5'
      },
      icon: 'Clock',
      keywords: ['rapide', 'urgent', 'délai', 'express', 'immédiat', '30 jours']
    },
    maximisateur: {
      id: 'maximisateur',
      label: 'Vendeur Maximisateur',
      description: 'Vendeur cherchant à optimiser au maximum le prix de vente de son bien',
      psychProfile: 'Analytique, négociateur, patient, orienté ROI, aime les détails',
      painPoints: [
        'Peur de vendre en dessous du potentiel',
        'Doutes sur la justesse du prix',
        'Comparaisons constantes avec le marché',
        'Négociations complexes'
      ],
      motivations: [
        'Maximiser le prix de vente',
        'Comprendre précisément la valeur',
        'Optimiser la négociation',
        'Timing optimal du marché'
      ],
      communicationStyle: 'Détaillé, chiffré, avec justifications et comparatifs',
      preferredChannels: ['Email détaillé', 'Rapports', 'Vidéoconférence'],
      colors: {
        primary: '#10b981', // Vert money
        secondary: '#86efac'
      },
      icon: 'TrendingUp',
      keywords: ['maximum', 'optimiser', 'prix', 'valeur', 'rentabilité', 'ROI']
    },
    succession: {
      id: 'succession',
      label: 'Vendeur Succession',
      description: 'Vendeur gérant un bien hérité ou en situation de succession familiale',
      psychProfile: 'Émotionnel, responsable familial, parfois débordé, besoin d\'accompagnement',
      painPoints: [
        'Charge émotionnelle de la succession',
        'Méconnaissance du marché immobilier',
        'Gestion familiale complexe',
        'Aspects fiscaux et juridiques'
      ],
      motivations: [
        'Faire honneur à la mémoire',
        'Équité entre héritiers',
        'Simplifier les démarches',
        'Optimisation fiscale'
      ],
      communicationStyle: 'Empathique, rassurant, avec accompagnement personnalisé',
      preferredChannels: ['Rendez-vous physique', 'Email', 'Appel téléphonique'],
      colors: {
        primary: '#8b5cf6', // Violet dignité
        secondary: '#c4b5fd'
      },
      icon: 'Users',
      keywords: ['succession', 'héritage', 'famille', 'fiscalité', 'accompagnement']
    },
    nouvelle_vie: {
      id: 'nouvelle_vie',
      label: 'Nouvelle Vie',
      description: 'Vendeur en transition de vie : retraite, déménagement, changement familial',
      psychProfile: 'En transition, optimiste mais anxieux du changement, projets d\'avenir',
      painPoints: [
        'Incertitude sur l\'avenir',
        'Timing de vente vs achat',
        'Adaptation aux nouveaux besoins',
        'Optimisation du budget futur'
      ],
      motivations: [
        'Financer le nouveau projet de vie',
        'Adapter le logement aux nouveaux besoins',
        'Sécuriser la transition',
        'Réaliser ses rêves'
      ],
      communicationStyle: 'Inspirant, orienté futur, avec vision long terme',
      preferredChannels: ['Email', 'Vidéoconférence', 'Newsletter'],
      colors: {
        primary: '#3b82f6', // Bleu horizon
        secondary: '#93c5fd'
      },
      icon: 'Home',
      keywords: ['retraite', 'déménagement', 'nouveau', 'transition', 'projet']
    },
    investisseur: {
      id: 'investisseur',
      label: 'Vendeur Investisseur',
      description: 'Investisseur immobilier vendant dans une logique de rentabilité et portfolio',
      psychProfile: 'Rationnel, calculateur, connaisseur du marché, réseau développé',
      painPoints: [
        'Optimisation fiscale complexe',
        'Timing de marché',
        'Réinvestissement optimal',
        'Gestion de portefeuille'
      ],
      motivations: [
        'Optimiser la plus-value',
        'Réinvestir intelligemment',
        'Défiscalisation',
        'Développer le patrimoine'
      ],
      communicationStyle: 'Technique, avec données de marché et analyses financières',
      preferredChannels: ['Email', 'Rapports', 'Webinaires'],
      colors: {
        primary: '#f59e0b', // Orange gold
        secondary: '#fcd34d'
      },
      icon: 'PieChart',
      keywords: ['investissement', 'rendement', 'fiscalité', 'plus-value', 'patrimoine']
    },
    primo: {
      id: 'primo',
      label: 'Primo-vendeur',
      description: 'Primo-accédant vendant son premier bien, souvent pour un plus grand',
      psychProfile: 'Novice, anxieux, besoin de pédagogie et réassurance, confiant mais prudent',
      painPoints: [
        'Méconnaissance du processus',
        'Peur de faire des erreurs',
        'Stress du timing achat/vente',
        'Budget serré'
      ],
      motivations: [
        'Réussir sa première vente',
        'Financer le prochain achat',
        'Apprendre et comprendre',
        'Éviter les pièges'
      ],
      communicationStyle: 'Pédagogique, rassurant, étape par étape',
      preferredChannels: ['Email explicatif', 'Appel téléphonique', 'Guide PDF'],
      colors: {
        primary: '#06b6d4', // Cyan frais
        secondary: '#67e8f9'
      },
      icon: 'Star',
      keywords: ['premier', 'débutant', 'apprentissage', 'étape', 'guide']
    }
  };

  // Requêtes API pour les statistiques
  const { data: guidesStats = [] } = useQuery<PersonaStats[]>({
    queryKey: ['/api/analytics/personas/stats']
  });

  const { data: guidesData = [] } = useQuery<Guide[]>({
    queryKey: ['/api/admin/guides']
  });

  // Vue d'ensemble des personas
  const renderPersonasOverview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Personas des Guides</h2>
          <p className="text-muted-foreground mt-2">
            Gestion complète des 6 profils de vendeurs et personnalisation des contenus
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setNewGuideOpen(true)}
            className="flex items-center gap-2"
            data-testid="button-new-guide"
          >
            <Plus className="w-4 h-4" />
            Nouveau guide
          </Button>
          <Button 
            onClick={() => setPersonaConfigOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
            data-testid="button-configure-personas"
          >
            <Settings className="w-4 h-4" />
            Configurer
          </Button>
        </div>
      </div>

      {/* Métriques globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold" data-testid="text-total-leads">
                {guidesStats.reduce((sum, stat) => sum + stat.leadsCount, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Téléchargements</p>
              <p className="text-2xl font-bold" data-testid="text-total-downloads">
                {guidesStats.reduce((sum, stat) => sum + stat.downloadsCount, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Guides Actifs</p>
              <p className="text-2xl font-bold" data-testid="text-active-guides">
                {guidesData.filter(g => g.isActive).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversion Moy.</p>
              <p className="text-2xl font-bold" data-testid="text-avg-conversion">
                {Math.round((guidesStats.reduce((sum, stat) => sum + stat.conversionRate, 0) / guidesStats.length) * 100)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Grille des personas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(GUIDE_PERSONAS).map(([key, label]) => {
          const config = personaConfigs[key];
          const stats = guidesStats.find(s => s.persona === key) || {
            persona: key,
            guidesCount: 0,
            downloadsCount: 0,
            leadsCount: 0,
            conversionRate: 0,
            avgReadTime: 0,
            topGuide: ''
          };

          return (
            <Card 
              key={key} 
              className="p-6 hover-elevate cursor-pointer transition-all"
              onClick={() => setSelectedPersona(key)}
              style={{ borderLeft: `4px solid ${config.colors.primary}` }}
              data-testid={`card-persona-${key}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${config.colors.primary}20` }}
                    >
                      <User 
                        className="w-6 h-6" 
                        style={{ color: config.colors.primary }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{label}</h3>
                      <p className="text-sm text-muted-foreground">{config.id}</p>
                    </div>
                  </div>
                  <Badge variant="outline" data-testid={`badge-guides-count-${key}`}>
                    {stats.guidesCount} guides
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {config.description}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Leads</p>
                    <p className="font-semibold" data-testid={`text-leads-${key}`}>
                      {stats.leadsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversion</p>
                    <p className="font-semibold" data-testid={`text-conversion-${key}`}>
                      {Math.round(stats.conversionRate * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Téléchargements</p>
                    <p className="font-semibold" data-testid={`text-downloads-${key}`}>
                      {stats.downloadsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Temps lecture</p>
                    <p className="font-semibold" data-testid={`text-readtime-${key}`}>
                      {stats.avgReadTime}min
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xs text-muted-foreground">
                    Guide top: {stats.topGuide}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPersona(config);
                      setPersonaConfigOpen(true);
                    }}
                    data-testid={`button-edit-${key}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Détail d'une persona
  const renderPersonaDetail = () => {
    if (!selectedPersona) return null;

    const config = personaConfigs[selectedPersona];
    const stats = guidesStats.find(s => s.persona === selectedPersona);
    const personaGuides = guidesData.filter(g => g.persona === selectedPersona);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedPersona(null)}
            data-testid="button-back-personas"
          >
            ← Retour aux personas
          </Button>
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${config.colors.primary}20` }}
            >
              <User 
                className="w-8 h-8" 
                style={{ color: config.colors.primary }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{GUIDE_PERSONAS[selectedPersona as keyof typeof GUIDE_PERSONAS]}</h2>
              <p className="text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="profile" data-testid="tab-profile">Profil</TabsTrigger>
            <TabsTrigger value="guides" data-testid="tab-guides">Guides</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            <TabsTrigger value="marketing" data-testid="tab-marketing">Marketing</TabsTrigger>
            <TabsTrigger value="config" data-testid="tab-config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profil Psychologique
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{config.psychProfile}</p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Points de douleur</h4>
                    <ul className="space-y-1">
                      {config.painPoints.map((point, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Motivations</h4>
                    <ul className="space-y-1">
                      {config.motivations.map((motivation, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {motivation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Communication
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Style de communication</h4>
                    <p className="text-sm text-muted-foreground">{config.communicationStyle}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Canaux préférés</h4>
                    <div className="flex flex-wrap gap-2">
                      {config.preferredChannels.map((channel, idx) => (
                        <Badge key={idx} variant="secondary">{channel}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Mots-clés</h4>
                    <div className="flex flex-wrap gap-2">
                      {config.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Couleurs de marque</h4>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: config.colors.primary }}
                        ></div>
                        <span className="text-sm">Primaire</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: config.colors.secondary }}
                        ></div>
                        <span className="text-sm">Secondaire</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Statistiques du persona */}
            {stats && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performances
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: config.colors.primary }}>
                      {stats.leadsCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Leads générés</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: config.colors.primary }}>
                      {stats.downloadsCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Téléchargements</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: config.colors.primary }}>
                      {Math.round(stats.conversionRate * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Taux conversion</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: config.colors.primary }}>
                      {stats.avgReadTime}min
                    </p>
                    <p className="text-sm text-muted-foreground">Temps lecture moy.</p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="guides" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                Guides associés à ce persona ({personaGuides.length})
              </h3>
              <Button 
                onClick={() => {}} 
                className="flex items-center gap-2"
                data-testid="button-create-guide-persona"
              >
                <Plus className="w-4 h-4" />
                Nouveau guide
              </Button>
            </div>

            <div className="grid gap-4">
              {personaGuides.map((guide) => (
                <Card key={guide.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{guide.title}</h4>
                        <Badge variant={guide.isActive ? "default" : "secondary"}>
                          {guide.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {guide.shortBenefit}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {guide.readingTime}min
                        </span>
                        <span>Slug: {guide.slug}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" data-testid={`button-edit-guide-${guide.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" data-testid={`button-analytics-guide-${guide.id}`}>
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" data-testid={`button-download-guide-${guide.id}`}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {personaGuides.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">Aucun guide pour ce persona</h4>
                  <p className="text-muted-foreground mb-4">
                    Créez le premier guide spécialement conçu pour {GUIDE_PERSONAS[selectedPersona as keyof typeof GUIDE_PERSONAS]}
                  </p>
                  <Button data-testid="button-create-first-guide">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer le premier guide
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Évolution des leads</h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  [Graphique évolution leads - à implémenter]
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Entonnoir de conversion</h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  [Graphique entonnoir - à implémenter]
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Sources de trafic</h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  [Graphique sources - à implémenter]
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Performance guides</h3>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  [Comparatif performance guides - à implémenter]
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="marketing" className="space-y-6">
            <div className="grid gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Séquences email automatisées
                </h3>
                <p className="text-muted-foreground mb-4">
                  Configuration des messages automatiques envoyés aux leads de ce persona
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email de livraison du guide</h4>
                      <p className="text-sm text-muted-foreground">Envoyé immédiatement après téléchargement</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Actif</Badge>
                      <Button variant="ghost" size="sm" data-testid="button-edit-email-delivery">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Conseil personnalisé J+2</h4>
                      <p className="text-sm text-muted-foreground">Tip spécialisé pour ce type de vendeur</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Actif</Badge>
                      <Button variant="ghost" size="sm" data-testid="button-edit-email-tip">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Étude de cas J+5</h4>
                      <p className="text-sm text-muted-foreground">Exemple concret de succès similaire</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Actif</Badge>
                      <Button variant="ghost" size="sm" data-testid="button-edit-email-case">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Offre soft J+10</h4>
                      <p className="text-sm text-muted-foreground">Proposition de service personnalisée</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Actif</Badge>
                      <Button variant="ghost" size="sm" data-testid="button-edit-email-offer">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages d'accroche personnalisés
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hero-message">Message hero (page guide)</Label>
                    <Textarea 
                      id="hero-message"
                      placeholder={`Message d'accroche principal pour ${GUIDE_PERSONAS[selectedPersona as keyof typeof GUIDE_PERSONAS]}`}
                      rows={3}
                      data-testid="textarea-hero-message"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cta-message">Call-to-action principal</Label>
                    <Input 
                      id="cta-message"
                      placeholder="Télécharger votre guide gratuit"
                      data-testid="input-cta-message"
                    />
                  </div>
                  <div>
                    <Label htmlFor="social-proof">Preuve sociale</Label>
                    <Input 
                      id="social-proof"
                      placeholder="Déjà 1,250+ vendeurs satisfaits"
                      data-testid="input-social-proof"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <PersonaConfigForm 
              persona={config}
              onSave={(updatedConfig) => {
                // Sauvegarder la configuration
                console.log('Saving persona config:', updatedConfig);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {selectedPersona ? renderPersonaDetail() : renderPersonasOverview()}

      {/* Modal de configuration globale */}
      <Dialog open={personaConfigOpen} onOpenChange={setPersonaConfigOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration des Personas</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Les modifications de configuration impactent tous les guides et messages existants.
                Testez en mode prévisualisation avant d'appliquer.
              </AlertDescription>
            </Alert>
            
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="messaging">Messages</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-4">
                  {Object.entries(personaConfigs).map(([key, config]) => (
                    <Card key={key} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: config.colors.primary }}
                          ></div>
                          <span className="font-medium">{config.label}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingPersona(config);
                          }}
                          data-testid={`button-config-${key}`}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="messaging" className="space-y-4">
                <p className="text-muted-foreground">
                  Configuration globale des templates de messages par défaut
                </p>
                {/* Configuration messaging */}
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-4">
                <p className="text-muted-foreground">
                  Configuration du tracking et des métriques par persona
                </p>
                {/* Configuration analytics */}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant de formulaire de configuration persona
interface PersonaConfigFormProps {
  persona: PersonaConfig;
  onSave: (config: PersonaConfig) => void;
}

function PersonaConfigForm({ persona, onSave }: PersonaConfigFormProps) {
  const [config, setConfig] = useState<PersonaConfig>(persona);

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Configuration avancée</h3>
      <div className="space-y-6">
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            rows={3}
            data-testid="textarea-persona-description"
          />
        </div>

        <div>
          <Label htmlFor="psychProfile">Profil psychologique</Label>
          <Textarea
            id="psychProfile"
            value={config.psychProfile}
            onChange={(e) => setConfig({ ...config, psychProfile: e.target.value })}
            rows={3}
            data-testid="textarea-psych-profile"
          />
        </div>

        <div>
          <Label htmlFor="communicationStyle">Style de communication</Label>
          <Textarea
            id="communicationStyle"
            value={config.communicationStyle}
            onChange={(e) => setConfig({ ...config, communicationStyle: e.target.value })}
            rows={2}
            data-testid="textarea-communication-style"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryColor">Couleur primaire</Label>
            <Input
              id="primaryColor"
              type="color"
              value={config.colors.primary}
              onChange={(e) => setConfig({ 
                ...config, 
                colors: { ...config.colors, primary: e.target.value }
              })}
              data-testid="input-primary-color"
            />
          </div>
          <div>
            <Label htmlFor="secondaryColor">Couleur secondaire</Label>
            <Input
              id="secondaryColor"
              type="color"
              value={config.colors.secondary}
              onChange={(e) => setConfig({ 
                ...config, 
                colors: { ...config.colors, secondary: e.target.value }
              })}
              data-testid="input-secondary-color"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={() => onSave(config)}
            data-testid="button-save-persona-config"
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Guide Card Component
interface GuideCardProps {
  guide: Guide;
  metrics?: {
    downloads: number;
    leads: number;
    conversionRate: number;
  };
  onEdit: (guide: Guide) => void;
  onPreview: (guide: Guide) => void;
  onDuplicate: (guide: Guide) => void;
  onToggleStatus: (id: string, status: boolean) => void;
  onDelete: (id: string) => void;
}

function GuideCard({ guide, metrics, onEdit, onPreview, onDuplicate, onToggleStatus, onDelete }: GuideCardProps) {
  return (
    <Card className="hover-elevate">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{guide.title}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {GUIDE_PERSONAS[guide.persona as keyof typeof GUIDE_PERSONAS]}
              </Badge>
              <Badge variant={guide.isActive ? "default" : "secondary"}>
                {guide.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription>{guide.shortBenefit}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{guide.readingTime} min</span>
          </div>
          <div className="flex items-center space-x-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span>{metrics?.downloads || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{metrics?.leads || 0} leads</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span>{metrics?.conversionRate || 0}%</span>
          </div>
        </div>
      </CardContent>
      <div className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={() => onPreview(guide)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(guide)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDuplicate(guide)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(guide.id, !guide.isActive)}
            >
              {guide.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => onDelete(guide.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Guide Preview Component
interface GuidePreviewProps {
  guide: Guide;
}

function GuidePreview({ guide }: GuidePreviewProps) {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">{guide.title}</h1>
        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{GUIDE_PERSONAS[guide.persona as keyof typeof GUIDE_PERSONAS]}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{guide.readingTime} min de lecture</span>
          </span>
        </div>
        <p className="mt-2 text-muted-foreground">{guide.shortBenefit}</p>
      </div>
      
      {guide.imageUrl && (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <img 
            src={guide.imageUrl} 
            alt={guide.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: guide.content }} />
      </div>
      
      {guide.pdfContent && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Contenu PDF bonus :</h3>
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: guide.pdfContent }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard({ domain = "estimation-immobilier-gironde.fr" }: AdminDashboardProps) {
  // Active section state for sidebar navigation
  const [activeSection, setActiveSection] = useState("overview");
  
  // Existing state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLeadType, setSelectedLeadType] = useState("all");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Article management state
  const [articleSearchTerm, setArticleSearchTerm] = useState("");
  const [articleStatus, setArticleStatus] = useState("all");
  const [articleCategory, setArticleCategory] = useState("all");
  const [activeArticleTab, setActiveArticleTab] = useState("liste");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<GeneratedArticle | null>(null);
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [calendarPopoverOpen, setCalendarPopoverOpen] = useState(false);

  // Article generation form state
  const [articleForm, setArticleForm] = useState({
    keyword: "",
    wordCount: 800,
    category: "estimation",
    audience: "proprietaires",
    tone: "professionnel"
  });

  // Article preview state (for existing articles)
  const [showArticlePreviewModal, setShowArticlePreviewModal] = useState(false);
  const [previewingArticle, setPreviewingArticle] = useState<Article | null>(null);

  // Email management state
  const [emailSearchTerm, setEmailSearchTerm] = useState("");
  const [emailStatusFilter, setEmailStatusFilter] = useState("all");
  const [emailCategoryFilter, setEmailCategoryFilter] = useState("all");
  const [activeEmailTab, setActiveEmailTab] = useState("history");
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailForm, setTestEmailForm] = useState({ email: "", name: "" });
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    category: "contact_confirmation",
    isActive: true,
    variables: "[]"
  });
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkEmailForm, setBulkEmailForm] = useState({
    templateId: "",
    recipients: "",
    delay: 1000
  });

  // Guides management state
  const [guideSearchTerm, setGuideSearchTerm] = useState("");
  const [guidePersonaFilter, setGuidePersonaFilter] = useState("all");
  const [guideStatusFilter, setGuideStatusFilter] = useState("all");
  const [guideViewMode, setGuideViewMode] = useState<"table" | "grid">("table");
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [showGuidePreview, setShowGuidePreview] = useState(false);
  const [previewingGuide, setPreviewingGuide] = useState<Guide | null>(null);
  const [guideStats, setGuideStats] = useState<{
    totalGuides: number;
    activeGuides: number;
    totalDownloads: number;
    totalLeads: number;
    conversionRate: number;
  } | null>(null);
  const [guideMetrics, setGuideMetrics] = useState<Record<string, {
    downloads: number;
    leads: number;
    conversionRate: number;
  }>>({});

  const queryClientInstance = useQueryClient();

  // Section change handler for sidebar navigation
  const onSectionChange = (section: string) => {
    setActiveSection(section);
  };

  // React Query hooks for email management
  const emailHistoryQueryParams = new URLSearchParams();
  if (emailStatusFilter && emailStatusFilter !== 'all') emailHistoryQueryParams.append('status', emailStatusFilter);
  if (emailCategoryFilter && emailCategoryFilter !== 'all') emailHistoryQueryParams.append('category', emailCategoryFilter);
  if (emailSearchTerm) emailHistoryQueryParams.append('q', emailSearchTerm);
  
  const emailHistoryQueryString = emailHistoryQueryParams.toString();
  
  const emailHistoryQuery = useQuery({
    queryKey: ['/api/email/history', emailHistoryQueryString],
    enabled: isAuthenticated === true
  });

  const emailTemplatesQuery = useQuery({
    queryKey: ['/api/email/templates'],
    enabled: isAuthenticated === true
  });

  const emailStatsQuery = useQuery({
    queryKey: ['/api/email/stats'],
    enabled: isAuthenticated === true
  });

  // Email data state
  useEffect(() => {
    if (emailHistoryQuery.data && Array.isArray(emailHistoryQuery.data)) {
      setEmailHistory(emailHistoryQuery.data);
    } else {
      setEmailHistory([]);
    }
  }, [emailHistoryQuery.data]);

  useEffect(() => {
    if (emailTemplatesQuery.data && Array.isArray(emailTemplatesQuery.data)) {
      setEmailTemplates(emailTemplatesQuery.data);
    } else {
      setEmailTemplates([]);
    }
  }, [emailTemplatesQuery.data]);

  useEffect(() => {
    if (emailStatsQuery.data) {
      setEmailStats(emailStatsQuery.data as EmailStats);
    } else {
      setEmailStats(null);
    }
  }, [emailStatsQuery.data]);

  // React Query hooks for articles
  const articlesQueryParams = new URLSearchParams();
  if (articleStatus && articleStatus !== 'all') articlesQueryParams.append('status', articleStatus);
  if (articleCategory && articleCategory !== 'all') articlesQueryParams.append('category', articleCategory);
  if (articleSearchTerm) articlesQueryParams.append('q', articleSearchTerm);
  
  const articlesQueryString = articlesQueryParams.toString();
  const articlesUrl = `/api/admin/articles${articlesQueryString ? `?${articlesQueryString}` : ''}`;
  
  const { data: articles = [], isLoading: articlesLoading, error: articlesError } = useQuery<Article[]>({
    queryKey: [articlesUrl],
    enabled: isAuthenticated === true,
    staleTime: 0
  });

  // Email React Query hooks
  const { data: emailTemplatesData = [], isLoading: emailTemplatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/admin/emails/templates', emailCategoryFilter],
    enabled: isAuthenticated === true,
    staleTime: 0
  });

  const { data: emailHistoryData = [], isLoading: emailHistoryLoading } = useQuery<EmailHistory[]>({
    queryKey: ['/api/admin/emails/history', emailStatusFilter],
    enabled: isAuthenticated === true,
    staleTime: 0
  });

  // Guides React Query hooks
  const guidesQueryParams = new URLSearchParams();
  if (guidePersonaFilter && guidePersonaFilter !== 'all') guidesQueryParams.append('persona', guidePersonaFilter);
  if (guideStatusFilter && guideStatusFilter !== 'all') guidesQueryParams.append('status', guideStatusFilter);
  if (guideSearchTerm) guidesQueryParams.append('q', guideSearchTerm);
  
  const guidesQueryString = guidesQueryParams.toString();
  const guidesUrl = `/api/admin/guides${guidesQueryString ? `?${guidesQueryString}` : ''}`;
  
  const { data: guides = [], isLoading: guidesLoading, error: guidesError } = useQuery<Guide[]>({
    queryKey: [guidesUrl],
    enabled: isAuthenticated === true,
    staleTime: 0
  });

  const { data: guideStatsData } = useQuery({
    queryKey: ['/api/admin/guides/stats'],
    enabled: isAuthenticated === true
  });

  const { data: guideMetricsData = {} } = useQuery({
    queryKey: ['/api/admin/guides/metrics'],
    enabled: isAuthenticated === true
  });

  // Guide data effects
  useEffect(() => {
    if (guideStatsData) {
      setGuideStats(guideStatsData as any);
    }
  }, [guideStatsData]);

  useEffect(() => {
    if (guideMetricsData && typeof guideMetricsData === 'object') {
      setGuideMetrics(guideMetricsData as any);
    }
  }, [guideMetricsData]);

  // Guide mutations
  const createGuideMutation = useMutation({
    mutationFn: async (guideData: InsertGuide) => {
      return apiRequest('POST', '/api/admin/guides', guideData);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/admin/guides'] });
      queryClientInstance.invalidateQueries({ predicate: (query) => 
        Boolean(query.queryKey[0] && typeof query.queryKey[0] === 'string' && 
        query.queryKey[0].startsWith('/api/admin/guides'))
      });
    }
  });

  const updateGuideMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertGuide> }) => {
      return apiRequest('PUT', `/api/admin/guides/${id}`, data);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/admin/guides'] });
      queryClientInstance.invalidateQueries({ predicate: (query) => 
        Boolean(query.queryKey[0] && typeof query.queryKey[0] === 'string' && 
        query.queryKey[0].startsWith('/api/admin/guides'))
      });
    }
  });

  const deleteGuideMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/guides/${id}`);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/admin/guides'] });
      queryClientInstance.invalidateQueries({ predicate: (query) => 
        Boolean(query.queryKey[0] && typeof query.queryKey[0] === 'string' && 
        query.queryKey[0].startsWith('/api/admin/guides'))
      });
    }
  });

  const toggleGuideStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest('PATCH', `/api/admin/guides/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/admin/guides'] });
    }
  });

  // Guide handler functions
  const handlePreviewGuide = (guide: Guide) => {
    setPreviewingGuide(guide);
    setShowGuidePreview(true);
  };

  const handleDuplicateGuide = (guide: Guide) => {
    const duplicatedGuide = {
      ...guide,
      title: `${guide.title} (Copie)`,
      slug: `${guide.slug}-copie-${Date.now()}`,
      isActive: false
    };
    delete (duplicatedGuide as any).id;
    createGuideMutation.mutate(duplicatedGuide);
  };

  const toggleGuideStatus = (id: string, isActive: boolean) => {
    toggleGuideStatusMutation.mutate({ id, isActive });
  };

  // Filtered guides based on search and filters
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = !guideSearchTerm || 
      guide.title.toLowerCase().includes(guideSearchTerm.toLowerCase()) ||
      guide.shortBenefit?.toLowerCase().includes(guideSearchTerm.toLowerCase());
    
    const matchesPersona = guidePersonaFilter === "all" || 
      guide.persona === guidePersonaFilter;
    
    const matchesStatus = guideStatusFilter === "all" || 
      (guideStatusFilter === "active" && guide.isActive) ||
      (guideStatusFilter === "inactive" && !guide.isActive);
    
    return matchesSearch && matchesPersona && matchesStatus;
  });

  const createArticleMutation = useMutation({
    mutationFn: async (articleData: any) => {
      const response = await apiRequest('POST', '/api/admin/articles', articleData);
      return response.json();
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/admin/articles'] });
      queryClientInstance.invalidateQueries({ predicate: (query) => 
        Boolean(query.queryKey[0] && typeof query.queryKey[0] === 'string' && 
        query.queryKey[0].startsWith('/api/admin/articles'))
      });
      // Close all modals and reset state
      setShowPreviewModal(false);
      setPreviewArticle(null);
      setShowScheduleModal(false);
      setCalendarPopoverOpen(false);
    }
  });

  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<Article>) => {
      const response = await apiRequest('PATCH', `/api/admin/articles/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/admin/articles'] });
      queryClientInstance.invalidateQueries({ predicate: (query) => 
        Boolean(query.queryKey[0] && typeof query.queryKey[0] === 'string' && 
        query.queryKey[0].startsWith('/api/admin/articles'))
      });
    }
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/articles/${id}`);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/admin/articles'] });
      queryClientInstance.invalidateQueries({ predicate: (query) => 
        Boolean(query.queryKey[0] && typeof query.queryKey[0] === 'string' && 
        query.queryKey[0].startsWith('/api/admin/articles'))
      });
    }
  });

  const generateArticleMutation = useMutation({
    mutationFn: async (formData: typeof articleForm) => {
      // Start progress tracking
      setGenerationProgress(0);
      setGenerationStep("Initialisation de la génération...");
      
      // Simulate progressive steps
      setTimeout(() => {
        setGenerationProgress(25);
        setGenerationStep("Recherche en cours...");
      }, 500);
      
      setTimeout(() => {
        setGenerationProgress(50);
        setGenerationStep("Génération du contenu...");
      }, 1500);
      
      setTimeout(() => {
        setGenerationProgress(75);
        setGenerationStep("Optimisation SEO...");
      }, 3000);
      
      const response = await apiRequest('POST', '/api/admin/articles/generate', formData);
      
      setGenerationProgress(100);
      setGenerationStep("Finalisation...");
      
      return response.json();
    },
    onSuccess: (data: GeneratedArticle) => {
      setPreviewArticle(data);
      // Ensure only preview modal is open
      setShowScheduleModal(false);
      setCalendarPopoverOpen(false);
      setShowPreviewModal(true);
      setGeneratingArticle(false);
      setGenerationProgress(0);
      setGenerationStep("");
    },
    onError: () => {
      setGeneratingArticle(false);
      setGenerationProgress(0);
      setGenerationStep("");
    }
  });

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          fetchData();
        } else {
          // Redirect to login page
          window.location.href = '/admin/login';
        }
      } else {
        setIsAuthenticated(false);
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
      setAuthError('Erreur de vérification d\'authentification');
    }
  };

  const fetchData = async () => {
    try {
      const [leadsResponse, estimationsResponse, contactsResponse, statsResponse] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/estimations'),
        fetch('/api/contacts'),
        fetch('/api/stats')
      ]);

      // Check for authentication errors
      if (leadsResponse.status === 401 || estimationsResponse.status === 401 || contactsResponse.status === 401 || statsResponse.status === 401) {
        setIsAuthenticated(false);
        window.location.href = '/admin/login';
        return;
      }

      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        setLeads(leadsData);
      } else {
        setAuthError(`Erreur lors du chargement des leads: ${leadsResponse.status}`);
      }

      if (estimationsResponse.ok) {
        const estimationsData = await estimationsResponse.json();
        setEstimations(estimationsData);
      } else {
        setAuthError(`Erreur lors du chargement des estimations: ${estimationsResponse.status}`);
      }

      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setContacts(contactsData);
      } else {
        setAuthError(`Erreur lors du chargement des contacts: ${contactsResponse.status}`);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        setAuthError(`Erreur lors du chargement des statistiques: ${statsResponse.status}`);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setAuthError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      new: { variant: "default" as const, label: "Nouveau" },
      contacted: { variant: "secondary" as const, label: "Contacté" },
      converted: { variant: "default" as const, label: "Converti" },
      archived: { variant: "outline" as const, label: "Archivé" }
    };
    return variants[status as keyof typeof variants] || variants.new;
  };

  const getLeadTypeBadge = (leadType: string) => {
    const variants = {
      estimation_quick: { 
        variant: "secondary" as const, 
        label: "Estimation Rapide", 
        color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
        icon: Home
      },
      estimation_detailed: { 
        variant: "default" as const, 
        label: "Estimation Détaillée", 
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        icon: Calculator
      },
      financing: { 
        variant: "secondary" as const, 
        label: "Financement", 
        color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
        icon: CreditCard
      },
      guide_download: { 
        variant: "outline" as const, 
        label: "Guide Téléchargé", 
        color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
        icon: BookOpen
      }
    };
    return variants[leadType as keyof typeof variants] || { 
      variant: "outline" as const, 
      label: leadType, 
      color: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800",
      icon: User
    };
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 401) {
        setIsAuthenticated(false);
        window.location.href = '/admin/login';
        return;
      }

      if (response.ok) {
        // Update local state
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === leadId ? { ...lead, status: newStatus } : lead
          )
        );
        // Refresh stats
        fetchData();
      } else {
        setAuthError(`Erreur lors de la mise à jour du lead: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      setAuthError('Erreur de connexion lors de la mise à jour');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });
      
      if (response.ok) {
        setIsAuthenticated(false);
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout request fails
      window.location.href = '/admin/login';
    }
  };

  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch = 
        lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.city || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = selectedStatus === "all" || lead.status === selectedStatus;
      const matchesLeadType = selectedLeadType === "all" || lead.leadType === selectedLeadType;
      
      return matchesSearch && matchesStatus && matchesLeadType;
    })
    .sort((a, b) => {
      // Priority 1: Leads with expert contact request (appointments) first
      if (a.wantsExpertContact && !b.wantsExpertContact) return -1;
      if (!a.wantsExpertContact && b.wantsExpertContact) return 1;
      
      // Priority 2: Sort by creation date (newest first)
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

  if (isAuthenticated === null || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <p>Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous devez être connecté pour accéder à cette page.
            <br />
            <a href="/admin/login" className="text-primary hover:underline">
              Cliquez ici pour vous connecter
            </a>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Custom sidebar width for admin dashboard
  const style = {
    "--sidebar-width": "20rem",       // 320px for better content
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={onSectionChange} 
        />
        <div className="flex flex-col flex-1">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-xl font-semibold">Dashboard Admin</h1>
                <p className="text-sm text-muted-foreground">
                  Gestion des leads et estimations pour {domain}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Error Alert */}
              {authError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              {/* Content based on active section */}
              {renderSectionContent()}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );

  // Helper function to render content based on active section
  function renderSectionContent() {
    // Stats Cards for overview sections
    const renderStatsCards = () => (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-leads">{stats?.totalLeads || 0}</p>
              <p className="text-sm text-muted-foreground">Total leads</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-chart-2/10 p-3 rounded-lg">
              <Phone className="h-6 w-6 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-new-leads">{stats?.newLeads || 0}</p>
              <p className="text-sm text-muted-foreground">Nouveaux leads</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-chart-3/10 p-3 rounded-lg">
              <Calculator className="h-6 w-6 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-estimations-today">{stats?.estimationsToday || 0}</p>
              <p className="text-sm text-muted-foreground">Estimations aujourd'hui</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-chart-4/10 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-conversion-rate">{stats?.conversionRate || "0.0"}%</p>
              <p className="text-sm text-muted-foreground">Taux conversion</p>
            </div>
          </div>
        </Card>
      </div>
    );

    switch (activeSection) {
      case "overview":
      case "stats":
        return (
          <>
            {renderStatsCards()}
            <AdminAnalyticsDashboard />
          </>
        );

      case "analytics":
        return <AdminAnalyticsDashboard />;

      case "leads":
      case "qualified-leads":
        return (
          <>
            {/* Filters */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par nom, email ou ville..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-leads"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedStatus === "all" ? "default" : "outline"}
                      onClick={() => setSelectedStatus("all")}
                      data-testid="button-filter-all"
                    >
                      Tous
                    </Button>
                    <Button
                      variant={selectedStatus === "new" ? "default" : "outline"}
                      onClick={() => setSelectedStatus("new")}
                      data-testid="button-filter-new"
                    >
                      Nouveaux
                    </Button>
                    <Button
                      variant={selectedStatus === "contacted" ? "default" : "outline"}
                      onClick={() => setSelectedStatus("contacted")}
                      data-testid="button-filter-contacted"
                    >
                      Contactés
                    </Button>
                  </div>
                </div>
                
                {/* Lead Type Filters */}
                <div className="flex flex-wrap gap-2">
                  <p className="text-sm text-muted-foreground self-center">Type de lead :</p>
                  <Button
                    size="sm"
                    variant={selectedLeadType === "all" ? "default" : "outline"}
                    onClick={() => setSelectedLeadType("all")}
                    data-testid="button-filter-leadtype-all"
                  >
                    Tous
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedLeadType === "estimation_quick" ? "default" : "outline"}
                    onClick={() => setSelectedLeadType("estimation_quick")}
                    data-testid="button-filter-leadtype-quick"
                  >
                    Estimation Rapide
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedLeadType === "estimation_detailed" ? "default" : "outline"}
                    onClick={() => setSelectedLeadType("estimation_detailed")}
                    data-testid="button-filter-leadtype-detailed"
                  >
                    Estimation Détaillée
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedLeadType === "financing" ? "default" : "outline"}
                    onClick={() => setSelectedLeadType("financing")}
                    data-testid="button-filter-leadtype-financing"
                  >
                    Financement
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedLeadType === "guide_download" ? "default" : "outline"}
                    onClick={() => setSelectedLeadType("guide_download")}
                    data-testid="button-filter-leadtype-guide"
                  >
                    Guide Téléchargé
                  </Button>
                </div>
              </div>
            </Card>

            {/* Leads Table */}
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {activeSection === "qualified-leads" ? "Leads qualifiés" : "Leads récents"}
                </h3>
                <div className="space-y-2">
                  {filteredLeads
                    .filter(lead => activeSection === "qualified-leads" 
                      ? lead.status === "contacted" || lead.status === "converted" 
                      : true
                    )
                    .map((lead, index) => {
                      const leadTypeBadge = getLeadTypeBadge(lead.leadType);
                      const LeadIcon = leadTypeBadge.icon;
                      return (
                    <div
                      key={lead.id}
                      className={`flex items-center justify-between p-4 border border-border rounded-lg hover-elevate ${
                        index % 2 === 1 ? 'bg-muted/20' : 'bg-background'
                      } ${
                        lead.wantsExpertContact ? 'ring-2 ring-primary/20 bg-primary/5' : ''
                      }`}
                      data-testid={`card-lead-${lead.id}`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-3">
                          {lead.wantsExpertContact && (
                            <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full border border-primary/20">
                              <UserCheck className="h-3 w-3 text-primary" />
                            </div>
                          )}
                          <h4 className="font-medium">
                            {lead.firstName} {lead.lastName}
                          </h4>
                          {lead.wantsExpertContact && (
                            <Badge variant="default" className="text-xs bg-primary/10 text-primary border-primary/20">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              RDV demandé
                            </Badge>
                          )}
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline"
                              className={`text-xs border ${leadTypeBadge.color}`}
                              data-testid={`badge-leadtype-${lead.id}`}
                            >
                              <LeadIcon className="h-3 w-3 mr-1" />
                              {leadTypeBadge.label}
                            </Badge>
                            <Badge 
                              variant={getStatusBadge(lead.status).variant}
                              data-testid={`badge-status-${lead.id}`}
                            >
                              {getStatusBadge(lead.status).label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{lead.email}</span>
                          </span>
                          {lead.phone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{lead.phone}</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{lead.city}</span>
                          </span>
                          {lead.source && (
                            <span className="flex items-center space-x-1">
                              <Globe className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground truncate max-w-32" title={lead.source}>
                                {lead.source.replace('https://', '').replace('http://', '').split('/')[0]}
                              </span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={lead.status}
                          onValueChange={(value) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger 
                            className="w-32"
                            data-testid={`select-status-${lead.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Nouveau</SelectItem>
                            <SelectItem value="contacted">Contacté</SelectItem>
                            <SelectItem value="converted">Converti</SelectItem>
                            <SelectItem value="archived">Archivé</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-details-${lead.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                      );
                    })}
                </div>
              </div>
            </Card>
          </>
        );

      case "contacts":
        return (
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Messages de contact</h3>
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 border border-border rounded-lg hover-elevate"
                    data-testid={`card-contact-${contact.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {contact.source}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{contact.email}</span>
                          </span>
                          {contact.phone && (
                            <span className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{contact.phone}</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
                          </span>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-sm">{contact.subject}</p>
                          <p className="text-sm text-muted-foreground">{contact.message}</p>
                        </div>
                      </div>
                      <Badge variant={contact.status === 'new' ? 'default' : 'secondary'}>
                        {contact.status === 'new' ? 'Nouveau' : 'Traité'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );

      case "estimations":
      case "estimation-stats":
        return (
          <div className="space-y-6">
            {/* Estimations Statistics */}
            {activeSection === "estimation-stats" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-chart-1/10 p-3 rounded-lg">
                      <Calculator className="h-6 w-6 text-chart-1" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{estimations.length}</p>
                      <p className="text-sm text-muted-foreground">Total estimations</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-chart-2/10 p-3 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-chart-2" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {estimations.filter(est => 
                          est.createdAt && new Date(est.createdAt).toDateString() === new Date().toDateString()
                        ).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-chart-3/10 p-3 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {estimations.length > 0 
                          ? Math.round(estimations.reduce((acc, est) => acc + (parseFloat(est.estimatedValue) || 0), 0) / estimations.length / 1000)
                          : 0}k€
                      </p>
                      <p className="text-sm text-muted-foreground">Valeur moyenne</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Estimations List */}
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {activeSection === "estimation-stats" ? "Estimations récentes" : "Toutes les estimations"}
                </h3>
                <div className="space-y-4">
                  {estimations.map((estimation) => (
                    <div
                      key={estimation.id}
                      className="p-4 border border-border rounded-lg hover-elevate"
                      data-testid={`card-estimation-${estimation.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">
                              {estimation.address}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {estimation.propertyType}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{estimation.surface}m²</span>
                            <span>{estimation.rooms} pièces</span>
                            <span>{estimation.city}</span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{estimation.createdAt ? new Date(estimation.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
                            </span>
                          </div>
                          {/* Lead information would need to be joined from the leads table */}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {parseFloat(estimation.estimatedValue).toLocaleString('fr-FR')}€
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {estimation.pricePerM2}€/m²
                          </p>
                          {estimation.confidence && (
                            <p className="text-xs text-muted-foreground">
                              Confiance: {estimation.confidence}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        );

      case "articles":
      case "content-stats":
        return (
          <div className="space-y-6">
            {/* Content Statistics */}
            {activeSection === "content-stats" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-chart-1/10 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-chart-1" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{articles.length}</p>
                      <p className="text-sm text-muted-foreground">Total articles</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-chart-2/10 p-3 rounded-lg">
                      <Globe className="h-6 w-6 text-chart-2" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {articles.filter(article => article.status === 'published').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Publiés</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-chart-3/10 p-3 rounded-lg">
                      <Edit className="h-6 w-6 text-chart-3" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {articles.filter(article => article.status === 'draft').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Brouillons</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-chart-4/10 p-3 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-chart-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {articles.filter(article => 
                          article.publishedAt && 
                          new Date(article.publishedAt).toDateString() === new Date().toDateString()
                        ).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Publiés aujourd'hui</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Articles Management */}
            <Tabs defaultValue="liste" className="space-y-6">
              <TabsList>
                <TabsTrigger value="liste">Liste des articles</TabsTrigger>
                <TabsTrigger value="generation">Générer un article</TabsTrigger>
              </TabsList>

              <TabsContent value="liste" className="space-y-6">
                {/* Article Filters */}
                <Card className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Rechercher un article..."
                        value={articleSearchTerm}
                        onChange={(e) => setArticleSearchTerm(e.target.value)}
                        data-testid="input-search-articles"
                      />
                    </div>
                    <Select value={articleStatus} onValueChange={setArticleStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="published">Publiés</SelectItem>
                        <SelectItem value="draft">Brouillons</SelectItem>
                        <SelectItem value="archived">Archivés</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={articleCategory} onValueChange={setArticleCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="estimation">Estimation</SelectItem>
                        <SelectItem value="financement">Financement</SelectItem>
                        <SelectItem value="vente">Vente</SelectItem>
                        <SelectItem value="marche">Marché</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                {/* Articles List */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Articles</h3>
                    <div className="space-y-4">
                      {articles
                        .filter(article => {
                          const matchesSearch = article.title.toLowerCase().includes(articleSearchTerm.toLowerCase()) ||
                                              article.content.toLowerCase().includes(articleSearchTerm.toLowerCase());
                          const matchesStatus = articleStatus === "all" || article.status === articleStatus;
                          const matchesCategory = articleCategory === "all" || article.category === articleCategory;
                          return matchesSearch && matchesStatus && matchesCategory;
                        })
                        .map((article) => (
                        <div
                          key={article.id}
                          className="p-4 border border-border rounded-lg hover-elevate"
                          data-testid={`card-article-${article.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium">{article.title}</h4>
                                <Badge 
                                  variant={article.status === 'published' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {article.status === 'published' ? 'Publié' : article.status === 'draft' ? 'Brouillon' : 'Archivé'}
                                </Badge>
                                {article.category && (
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {article.category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {article.metaDescription || article.summary || 'Aucune description'}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                {article.publishedAt && (
                                  <span>Publié le {new Date(article.publishedAt).toLocaleDateString('fr-FR')}</span>
                                )}
                                {article.updatedAt && (
                                  <span>Modifié le {new Date(article.updatedAt).toLocaleDateString('fr-FR')}</span>
                                )}
                                {article.authorName && (
                                  <span>Par {article.authorName}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPreviewingArticle(article);
                                  setShowArticlePreviewModal(true);
                                }}
                                data-testid={`button-preview-${article.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateArticleMutation.mutate({ 
                                  id: article.id, 
                                  status: article.status === 'published' ? 'draft' : 'published',
                                  publishedAt: article.status === 'published' ? null : new Date()
                                })}
                                disabled={updateArticleMutation.isPending}
                                data-testid={`button-toggle-${article.id}`}
                              >
                                {updateArticleMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Globe className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteArticleMutation.mutate(article.id)}
                                disabled={deleteArticleMutation.isPending}
                                data-testid={`button-delete-${article.id}`}
                              >
                                {deleteArticleMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="generation" className="space-y-6">
                <Card className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Générer un nouvel article</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyword">Mot-clé principal</Label>
                        <Input
                          id="keyword"
                          placeholder="ex: estimation immobilière Bordeaux"
                          value={articleForm.keyword}
                          onChange={(e) => setArticleForm({...articleForm, keyword: e.target.value})}
                          data-testid="input-article-keyword"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="wordCount">Nombre de mots</Label>
                        <Select 
                          value={articleForm.wordCount.toString()} 
                          onValueChange={(value) => setArticleForm({...articleForm, wordCount: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="500">500 mots</SelectItem>
                            <SelectItem value="800">800 mots</SelectItem>
                            <SelectItem value="1200">1200 mots</SelectItem>
                            <SelectItem value="1500">1500 mots</SelectItem>
                            <SelectItem value="2000">2000 mots</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Catégorie</Label>
                        <Select 
                          value={articleForm.category} 
                          onValueChange={(value) => setArticleForm({...articleForm, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="estimation">Estimation</SelectItem>
                            <SelectItem value="financement">Financement</SelectItem>
                            <SelectItem value="vente">Vente</SelectItem>
                            <SelectItem value="marche">Marché immobilier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="audience">Audience cible</Label>
                        <Select 
                          value={articleForm.audience} 
                          onValueChange={(value) => setArticleForm({...articleForm, audience: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="proprietaires">Propriétaires vendeurs</SelectItem>
                            <SelectItem value="acheteurs">Acheteurs potentiels</SelectItem>
                            <SelectItem value="investisseurs">Investisseurs</SelectItem>
                            <SelectItem value="professionnels">Professionnels immobilier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tone">Ton de l'article</Label>
                        <Select 
                          value={articleForm.tone} 
                          onValueChange={(value) => setArticleForm({...articleForm, tone: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professionnel">Professionnel</SelectItem>
                            <SelectItem value="accessible">Accessible</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                            <SelectItem value="didactique">Didactique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setGeneratingArticle(true);
                        generateArticleMutation.mutate(articleForm);
                      }}
                      disabled={!articleForm.keyword || generatingArticle}
                      className="w-full"
                      data-testid="button-generate-article"
                    >
                      {generatingArticle ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Générer l'article
                        </>
                      )}
                    </Button>

                    {generatingArticle && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{generationStep}</span>
                          <span>{generationProgress}%</span>
                        </div>
                        <Progress value={generationProgress} className="w-full" />
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        );

      case "email-sequences":
        return <EmailSequenceManager />;

      case "email-templates":
        return (
          <div className="space-y-6">
            <Tabs defaultValue="templates" className="space-y-6">
              <TabsList>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
                <TabsTrigger value="stats">Statistiques</TabsTrigger>
                <TabsTrigger value="test">Test</TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="space-y-6">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Templates Email</h3>
                      <Button
                        onClick={() => {
                          setTemplateForm({
                            name: "",
                            subject: "",
                            htmlContent: "",
                            textContent: "",
                            category: "contact_confirmation",
                            isActive: true,
                            variables: "[]"
                          });
                          setSelectedTemplate(null);
                          setShowTemplateModal(true);
                        }}
                        data-testid="button-new-template"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau template
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {emailTemplatesData.map((template) => (
                        <div
                          key={template.id}
                          className="p-4 border border-border rounded-lg hover-elevate"
                          data-testid={`card-template-${template.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium">{template.name}</h4>
                                <Badge 
                                  variant={template.isActive ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {template.isActive ? 'Actif' : 'Inactif'}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {template.category.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{template.subject}</p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                {template.createdAt && (
                                  <span>Créé le {new Date(template.createdAt).toLocaleDateString('fr-FR')}</span>
                                )}
                                {template.updatedAt && (
                                  <span>Modifié le {new Date(template.updatedAt).toLocaleDateString('fr-FR')}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setShowTemplateModal(true);
                                }}
                                data-testid={`button-edit-template-${template.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setShowTestEmailModal(true);
                                }}
                                data-testid={`button-test-template-${template.id}`}
                              >
                                <TestTube className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Historique des emails</h3>
                      <div className="flex gap-2">
                        <Select value={emailStatusFilter} onValueChange={setEmailStatusFilter}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="sent">Envoyés</SelectItem>
                            <SelectItem value="failed">Échoués</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {emailHistoryData.map((email) => (
                        <div
                          key={email.id}
                          className="p-4 border border-border rounded-lg hover-elevate"
                          data-testid={`card-email-${email.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium">{email.subject}</h4>
                                <Badge 
                                  variant={
                                    email.status === 'sent' ? 'default' : 
                                    email.status === 'failed' ? 'destructive' : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {email.status === 'sent' ? 'Envoyé' : 
                                   email.status === 'failed' ? 'Échoué' : 
                                   email.status === 'pending' ? 'En attente' : email.status}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>À: {email.recipientEmail}</span>
                                {email.recipientName && <span>({email.recipientName})</span>}
                                <span>De: {email.senderEmail}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                {email.sentAt && (
                                  <span>Envoyé le {new Date(email.sentAt).toLocaleDateString('fr-FR')} à {new Date(email.sentAt).toLocaleTimeString('fr-FR')}</span>
                                )}
                                {email.createdAt && !email.sentAt && (
                                  <span>Créé le {new Date(email.createdAt).toLocaleDateString('fr-FR')}</span>
                                )}
                              </div>
                              {email.errorMessage && (
                                <p className="text-sm text-destructive">Erreur: {email.errorMessage}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-chart-1/10 p-3 rounded-lg">
                        <Send className="h-6 w-6 text-chart-1" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{emailStats?.totalSent || 0}</p>
                        <p className="text-sm text-muted-foreground">Total envoyés</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-chart-2/10 p-3 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-chart-2" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{emailStats?.totalFailed || 0}</p>
                        <p className="text-sm text-muted-foreground">Échoués</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-chart-3/10 p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-chart-3" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{emailStats?.sentToday || 0}</p>
                        <p className="text-sm text-muted-foreground">Envoyés aujourd'hui</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-chart-4/10 p-3 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-chart-4" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{emailStats?.successRate || "0"}%</p>
                        <p className="text-sm text-muted-foreground">Taux de réussite</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="test" className="space-y-6">
                <Card className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Tester un template</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="testEmail">Email de test</Label>
                        <Input
                          id="testEmail"
                          type="email"
                          placeholder="votre@email.com"
                          value={testEmailForm.email}
                          onChange={(e) => setTestEmailForm({...testEmailForm, email: e.target.value})}
                          data-testid="input-test-email"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="testName">Nom (optionnel)</Label>
                        <Input
                          id="testName"
                          placeholder="Votre nom"
                          value={testEmailForm.name}
                          onChange={(e) => setTestEmailForm({...testEmailForm, name: e.target.value})}
                          data-testid="input-test-name"
                        />
                      </div>
                    </div>

                    <Button
                      disabled={!testEmailForm.email || !selectedTemplate}
                      data-testid="button-send-test"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer le test
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        );


      case "guides":
        return (
          <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">Guides vendeurs</h2>
                <p className="text-muted-foreground">Gérez vos guides téléchargeables par persona</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-guide">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau guide
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau guide</DialogTitle>
                  </DialogHeader>
                  <GuideForm onSubmit={(guideData) => {
                    createGuideMutation.mutate(guideData);
                  }} />
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters and search */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Rechercher un guide..."
                      value={guideSearchTerm}
                      onChange={(e) => setGuideSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-guides"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={guidePersonaFilter} onValueChange={setGuidePersonaFilter}>
                    <SelectTrigger className="w-48" data-testid="select-persona-filter">
                      <SelectValue placeholder="Filtrer par persona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les personas</SelectItem>
                      {Object.entries(GUIDE_PERSONAS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={guideStatusFilter} onValueChange={setGuideStatusFilter}>
                    <SelectTrigger className="w-32" data-testid="select-status-filter">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Total guides</h3>
                </div>
                <p className="text-2xl font-bold mt-2" data-testid="stat-total-guides">
                  {guideStats?.totalGuides || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {guideStats?.activeGuides || 0} actifs
                </p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Téléchargements</h3>
                </div>
                <p className="text-2xl font-bold mt-2" data-testid="stat-total-downloads">
                  {guideStats?.totalDownloads || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Ce mois-ci
                </p>
              </Card>
              <Card className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Leads générés</h3>
                </div>
                <p className="text-2xl font-bold mt-2" data-testid="stat-total-leads">
                  {guideStats?.totalLeads || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Taux conv.: {guideStats?.conversionRate || 0}%
                </p>
              </Card>
            </div>

            {/* Guides list */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Liste des guides</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGuideViewMode(guideViewMode === "table" ? "grid" : "table")}
                      data-testid="button-toggle-view"
                    >
                      {guideViewMode === "table" ? (
                        <><Grid3X3 className="h-4 w-4 mr-2" />Grille</>
                      ) : (
                        <><FileText className="h-4 w-4 mr-2" />Tableau</>
                      )}
                    </Button>
                  </div>
                </div>

                {guidesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 border border-border rounded-lg">
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : guideViewMode === "table" ? (
                  <div className="space-y-2">
                    {filteredGuides.map((guide, index) => (
                      <div
                        key={guide.id}
                        className={`flex items-center justify-between p-4 border border-border rounded-lg hover-elevate ${
                          index % 2 === 1 ? 'bg-muted/20' : 'bg-background'
                        }`}
                        data-testid={`guide-row-${guide.id}`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">{guide.title}</h4>
                            <Badge 
                              variant="outline"
                              className="text-xs"
                              data-testid={`badge-persona-${guide.id}`}
                            >
                              {GUIDE_PERSONAS[guide.persona as keyof typeof GUIDE_PERSONAS]}
                            </Badge>
                            <Badge 
                              variant={guide.isActive ? "default" : "secondary"}
                              data-testid={`badge-status-${guide.id}`}
                            >
                              {guide.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{guide.readingTime} min</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Download className="h-3 w-3" />
                              <span>{guideMetrics[guide.id]?.downloads || 0} téléchargements</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{guideMetrics[guide.id]?.leads || 0} leads</span>
                            </span>
                            <span className="text-xs">
                              Ordre: {guide.sortOrder}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewGuide(guide)}
                            data-testid={`button-preview-${guide.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-edit-${guide.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Modifier le guide</DialogTitle>
                              </DialogHeader>
                              <GuideForm
                                guide={guide}
                                onSubmit={(guideData) => {
                                  updateGuideMutation.mutate({ id: guide.id, data: guideData });
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateGuide(guide)}
                            data-testid={`button-duplicate-${guide.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleGuideStatus(guide.id, !guide.isActive)}
                            data-testid={`button-toggle-status-${guide.id}`}
                          >
                            {guide.isActive ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                data-testid={`button-delete-${guide.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer le guide "{guide.title}" ? 
                                  Cette action est irréversible et supprimera également toutes les statistiques associées.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteGuideMutation.mutate(guide.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGuides.map((guide) => (
                      <GuideCard 
                        key={guide.id} 
                        guide={guide} 
                        metrics={guideMetrics[guide.id]}
                        onEdit={(guide) => setEditingGuide(guide)}
                        onPreview={(guide) => handlePreviewGuide(guide)}
                        onDuplicate={(guide) => handleDuplicateGuide(guide)}
                        onToggleStatus={(id, status) => toggleGuideStatus(id, status)}
                        onDelete={(id) => deleteGuideMutation.mutate(id)}
                      />
                    ))}
                  </div>
                )}

                {filteredGuides.length === 0 && !guidesLoading && (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {guideSearchTerm || guidePersonaFilter !== "all" || guideStatusFilter !== "all"
                        ? "Aucun guide ne correspond aux filtres sélectionnés."
                        : "Aucun guide disponible. Créez votre premier guide pour commencer."}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Guide preview modal */}
            <Dialog open={showGuidePreview} onOpenChange={setShowGuidePreview}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Aperçu du guide</DialogTitle>
                </DialogHeader>
                {previewingGuide && (
                  <GuidePreview guide={previewingGuide} />
                )}
              </DialogContent>
            </Dialog>
          </div>
        );



      // Dashboard sections
      case "recent-activity":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Activité récente</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Activité des utilisateurs et actions récentes sur la plateforme...</p>
            </Card>
          </div>
        );

      case "kpi-metrics":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Indicateurs clés (KPI)</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Tableau de bord des indicateurs de performance clés...</p>
            </Card>
          </div>
        );

      // Leads & Contacts sections
      case "lead-scoring":
        return <LeadScoringDashboard />;

      case "follow-up":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Suivi des relances</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Planification et suivi des relances clients...</p>
            </Card>
          </div>
        );

      case "sms-campaigns":
        return <SmsCampaignsManager />;

      // Estimations sections
      case "pending-estimations":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Estimations en attente</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Estimations en cours de traitement...</p>
            </Card>
          </div>
        );

      case "completed-estimations":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Estimations terminées</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Historique des estimations finalisées...</p>
            </Card>
          </div>
        );

      case "price-accuracy":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Précision des prix</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Analyse de la précision de l'algorithme d'estimation...</p>
            </Card>
          </div>
        );

      case "estimation-export":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Export des données</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Export des données d'estimation vers Excel/CSV...</p>
            </Card>
          </div>
        );

      // Content sections
      case "article-categories":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Catégories d'articles</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Gestion des catégories et tags d'articles...</p>
            </Card>
          </div>
        );


      case "guide-personas":
        return <GuidePersonasSection />;

      case "content-seo":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">SEO & Visibilité</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Optimisation SEO du contenu et analyse de visibilité...</p>
            </Card>
          </div>
        );

      case "pdf-downloads":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Téléchargements PDF</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Statistiques des téléchargements de guides PDF...</p>
            </Card>
          </div>
        );

      // Analytics sections
      case "conversion-funnel":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Entonnoir de conversion</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Analyse du parcours de conversion des visiteurs...</p>
            </Card>
          </div>
        );

      case "traffic-analysis":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analyse du trafic</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Statistiques détaillées du trafic web...</p>
            </Card>
          </div>
        );

      case "lead-sources":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Sources de leads</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Analyse des canaux d'acquisition de leads...</p>
            </Card>
          </div>
        );

      case "user-behavior":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Comportement utilisateur</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Analyse du comportement des visiteurs sur le site...</p>
            </Card>
          </div>
        );

      case "roi-analysis":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analyse ROI</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Calcul du retour sur investissement des campagnes...</p>
            </Card>
          </div>
        );

      case "geographic-data":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Données géographiques</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Répartition géographique des leads et estimations...</p>
            </Card>
          </div>
        );

      // Settings sections
      case "admin-settings":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Configuration générale</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Paramètres généraux de l'application...</p>
            </Card>
          </div>
        );

      case "sms-templates":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Templates SMS</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Gestion des modèles de messages SMS...</p>
            </Card>
          </div>
        );

      case "user-management":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Administration des comptes utilisateurs...</p>
            </Card>
          </div>
        );

      case "api-settings":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Clés API</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Configuration des clés API et intégrations...</p>
            </Card>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Notifications</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Configuration des notifications système...</p>
            </Card>
          </div>
        );

      case "system-logs":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Logs système</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Consultation des journaux système...</p>
            </Card>
          </div>
        );

      case "backup-data":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Sauvegarde</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Gestion des sauvegardes de données...</p>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Section "{activeSection}" en cours de développement...
            </p>
          </div>
        );
    }
  }
}
