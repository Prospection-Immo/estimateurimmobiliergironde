import { useState } from "react";
import { useLocation, Link } from "wouter";
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
  Home,
  Calculator,
  Euro,
  FileText,
  BookOpen,
  Newspaper,
  ChevronDown,
  ChevronRight,
  BarChart3,
  HelpCircle,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  domain?: string;
}

export function AppSidebar({ domain = "estimation-immobilier-gironde.fr" }: AppSidebarProps) {
  const [location] = useLocation();
  const isGironde = domain.includes("gironde");
  
  // Accordion state management
  const [openSections, setOpenSections] = useState({
    estimation: true,
    resources: true,
    information: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Check if current path matches any of the paths in a section
  const isSectionActive = (paths: string[]) => {
    return paths.some(path => location === path);
  };

  // Navigation sections with accordions
  const navigationSections = [
    {
      key: 'estimation' as const,
      label: 'Estimation & Prix',
      icon: Calculator,
      items: [
        { href: "/estimation", label: "Estimation gratuite", icon: Calculator },
        { href: "/prix-m2", label: "Prix au m²", icon: BarChart3 },
      ]
    },
    {
      key: 'resources' as const,  
      label: 'Ressources Vendeurs',
      icon: BookOpen,
      items: [
        { href: "/guides", label: "Guides vendeurs", icon: BookOpen },
        { href: "/financement", label: "Financement", icon: Euro },
      ]
    },
    {
      key: 'information' as const,
      label: 'Information',
      icon: Newspaper,
      items: [
        { href: "/actualites", label: "Actualités", icon: Newspaper },
      ]
    }
  ];

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center space-x-2 px-2 py-4">
          <div className="bg-primary text-primary-foreground p-2 rounded-md">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <Link href="/" className="block">
              <h1 className="font-semibold text-base leading-tight">
                {isGironde ? "Estimation Gironde" : "Estimation Immobilière"}
              </h1>
              <p className="text-xs text-muted-foreground">Expert local</p>
            </Link>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Home - Always visible */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location === "/"}
                data-testid="sidebar-link-home"
              >
                <Link href="/">
                  <Home className="h-4 w-4" />
                  <span>Accueil</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

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
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={location === item.href}
                          data-testid={`sidebar-link-${item.label.toLowerCase().replace(/ /g, '-')}`}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        ))}

        {/* Help section */}
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/contact"}
                  data-testid="sidebar-link-contact"
                >
                  <Link href="/contact">
                    <HelpCircle className="h-4 w-4" />
                    <span>Contact & Aide</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <div className="p-2">
          <div className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} {isGironde ? "Estimation Gironde" : "Estimation Immobilière"}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}