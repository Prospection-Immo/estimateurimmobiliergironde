import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BarChart3,
  Users,
  Calculator,
  FileText,
  PieChart,
  Settings,
  ChevronDown,
  ChevronRight,
  User,
  Phone,
  Mail,
  TrendingUp,
  MessageSquare,
  Edit,
  Globe,
  UserCheck,
  Shield,
  Database,
  Filter,
  Clock,
  DollarSign,
  Target,
  Eye,
  BookOpen,
  Tag,
  Zap,
  Bell,
  Key,
  Palette,
  Server
} from "lucide-react";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  // Accordion state management
  const [openSections, setOpenSections] = useState({
    dashboard: true,
    leads: true,
    estimations: true,
    content: true,
    analytics: true,
    settings: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Navigation sections with accordions
  const navigationSections = [
    {
      key: 'dashboard' as const,
      label: 'Tableau de bord',
      icon: BarChart3,
      items: [
        { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
        { id: "stats", label: "Statistiques générales", icon: TrendingUp },
        { id: "recent-activity", label: "Activité récente", icon: Clock },
        { id: "kpi-metrics", label: "Indicateurs clés", icon: Target },
      ]
    },
    {
      key: 'leads' as const,
      label: 'Leads & Contacts',
      icon: Users,
      items: [
        { id: "leads", label: "Tous les leads", icon: User },
        { id: "contacts", label: "Contacts", icon: Phone },
        { id: "qualified-leads", label: "Leads qualifiés", icon: UserCheck },
        { id: "lead-scoring", label: "Scoring leads", icon: Target },
        { id: "follow-up", label: "Suivi relances", icon: Clock },
        { id: "email-sequences", label: "Email Marketing", icon: Mail },
        { id: "sms-campaigns", label: "Campagnes SMS", icon: MessageSquare },
      ]
    },
    {
      key: 'estimations' as const,
      label: 'Estimations',
      icon: Calculator,
      items: [
        { id: "estimations", label: "Toutes les estimations", icon: Calculator },
        { id: "pending-estimations", label: "En attente", icon: Clock },
        { id: "completed-estimations", label: "Terminées", icon: UserCheck },
        { id: "estimation-stats", label: "Statistiques", icon: BarChart3 },
        { id: "price-accuracy", label: "Précision prix", icon: DollarSign },
        { id: "estimation-export", label: "Export données", icon: Database },
      ]
    },
    {
      key: 'content' as const,
      label: 'Guides & Articles',
      icon: FileText,
      items: [
        { id: "articles", label: "Tous les articles", icon: FileText },
        { id: "article-categories", label: "Catégories articles", icon: Tag },
        { id: "guides", label: "Guides vendeurs", icon: BookOpen },
        { id: "guide-personas", label: "Personas guides", icon: User },
        { id: "content-stats", label: "Performance contenu", icon: TrendingUp },
        { id: "content-seo", label: "SEO & visibilité", icon: Eye },
        { id: "pdf-downloads", label: "Téléchargements PDF", icon: Database },
      ]
    },
    {
      key: 'analytics' as const,
      label: 'Analytics',
      icon: PieChart,
      items: [
        { id: "analytics", label: "Dashboard analytics", icon: PieChart },
        { id: "conversion-funnel", label: "Entonnoir conversion", icon: TrendingUp },
        { id: "traffic-analysis", label: "Analyse trafic", icon: Eye },
        { id: "lead-sources", label: "Sources de leads", icon: Target },
        { id: "user-behavior", label: "Comportement utilisateur", icon: Users },
        { id: "roi-analysis", label: "Analyse ROI", icon: DollarSign },
        { id: "geographic-data", label: "Données géographiques", icon: Globe },
      ]
    },
    {
      key: 'settings' as const,
      label: 'Paramètres',
      icon: Settings,
      items: [
        { id: "admin-settings", label: "Configuration générale", icon: Settings },
        { id: "email-templates", label: "Templates Email", icon: Mail },
        { id: "sms-templates", label: "Templates SMS", icon: MessageSquare },
        { id: "user-management", label: "Utilisateurs", icon: Shield },
        { id: "api-settings", label: "Clés API", icon: Key },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "system-logs", label: "Logs système", icon: Server },
        { id: "database-sync", label: "Synchronisation DB", icon: Database },
        { id: "backup-data", label: "Sauvegarde", icon: Server },
      ]
    }
  ];

  return (
    <Sidebar data-testid="admin-sidebar">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center space-x-2 px-2 py-4">
          <div className="bg-primary text-primary-foreground p-2 rounded-md">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-base leading-tight">
              Admin Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">Estimation Gironde</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation sections with accordions */}
        {navigationSections.map((section) => (
          <SidebarGroup key={section.key}>
            <Collapsible
              open={openSections[section.key]}
              onOpenChange={() => toggleSection(section.key)}
            >
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="group/collapsible hover-elevate cursor-pointer bg-muted/60 dark:bg-muted/80 px-3 py-2.5 rounded-md font-semibold text-base border-l-4 border-primary/60">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <section.icon className="h-5 w-5 text-primary" />
                      <span className="text-foreground font-semibold">{section.label}</span>
                    </div>
                    {openSections[section.key] ? (
                      <ChevronDown className="h-4 w-4 transition-transform text-primary" />
                    ) : (
                      <ChevronRight className="h-4 w-4 transition-transform text-primary" />
                    )}
                  </div>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => onSectionChange(item.id)}
                          isActive={activeSection === item.id}
                          data-testid={`admin-sidebar-${item.id}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <div className="p-2">
          <div className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Admin Dashboard
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}