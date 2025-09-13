import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  UserCheck
} from "lucide-react";

import type { Lead, Estimation, Contact, Article, EmailTemplate, EmailHistory } from "@shared/schema";

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

      case "conversion-funnel":
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Entonnoir de conversion</h3>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Visualisation de l'entonnoir de conversion en cours de développement...
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      case "guides":
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Guides vendeurs</h3>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Gestion des guides vendeurs en cours de développement...
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      case "admin-settings":
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Configuration Admin</h3>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Paramètres administrateur en cours de développement...
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      case "user-management":
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Gestion des utilisateurs</h3>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Gestion des utilisateurs en cours de développement...
                  </p>
                </div>
              </div>
            </Card>
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
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Scoring des leads</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Système de notation et qualification automatique des leads...</p>
            </Card>
          </div>
        );

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
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Campagnes SMS</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Gestion des campagnes SMS marketing...</p>
            </Card>
          </div>
        );

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

      case "guides":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Guides vendeurs</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Gestion des guides téléchargeables pour vendeurs...</p>
            </Card>
          </div>
        );

      case "guide-personas":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Personas des guides</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Configuration des personas cibles pour les guides...</p>
            </Card>
          </div>
        );

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
