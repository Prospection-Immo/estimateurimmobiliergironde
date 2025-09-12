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
  Shield
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
        { id: "stats", label: "Statistiques", icon: TrendingUp },
      ]
    },
    {
      key: 'leads' as const,
      label: 'Leads & Contacts',
      icon: Users,
      items: [
        { id: "leads", label: "Leads", icon: User },
        { id: "contacts", label: "Contacts", icon: Phone },
        { id: "qualified-leads", label: "Leads qualifiés", icon: UserCheck },
        { id: "email-sequences", label: "Email Marketing", icon: Mail },
      ]
    },
    {
      key: 'estimations' as const,
      label: 'Estimations',
      icon: Calculator,
      items: [
        { id: "estimations", label: "Toutes les estimations", icon: Calculator },
        { id: "estimation-stats", label: "Statistiques", icon: BarChart3 },
      ]
    },
    {
      key: 'content' as const,
      label: 'Guides & Articles',
      icon: FileText,
      items: [
        { id: "articles", label: "Articles", icon: FileText },
        { id: "guides", label: "Guides vendeurs", icon: Globe },
        { id: "content-stats", label: "Performance contenu", icon: TrendingUp },
      ]
    },
    {
      key: 'analytics' as const,
      label: 'Analytics',
      icon: PieChart,
      items: [
        { id: "analytics", label: "Analytics avancés", icon: PieChart },
        { id: "conversion-funnel", label: "Entonnoir conversion", icon: TrendingUp },
      ]
    },
    {
      key: 'settings' as const,
      label: 'Paramètres',
      icon: Settings,
      items: [
        { id: "admin-settings", label: "Configuration", icon: Settings },
        { id: "email-templates", label: "Templates Email", icon: Mail },
        { id: "user-management", label: "Utilisateurs", icon: Shield },
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
                <SidebarGroupLabel className="group/collapsible hover-elevate cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <section.icon className="h-4 w-4" />
                      <span>{section.label}</span>
                    </div>
                    {openSections[section.key] ? (
                      <ChevronDown className="h-4 w-4 transition-transform" />
                    ) : (
                      <ChevronRight className="h-4 w-4 transition-transform" />
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