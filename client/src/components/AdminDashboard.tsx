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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Filter
} from "lucide-react";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  propertyType: string;
  address?: string;
  city: string;
  postalCode?: string;
  surface?: number;
  estimatedValue?: string;
  leadType: string;
  status: string;
  createdAt?: string;
}

interface Estimation {
  id: string;
  leadId: string;
  propertyType: string;
  address: string;
  city: string;
  surface: number;
  rooms: number;
  estimatedValue: string;
  pricePerM2: string;
  confidence: number;
  methodology?: string;
  comparableProperties?: string;
  createdAt: string;
  lead?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    leadType: string;
  };
}

interface Contact {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  subject: string;
  message: string;
  source: string;
  status: string;
  createdAt: string;
}

interface Stats {
  totalLeads: number;
  newLeads: number;
  estimationsToday: number;
  conversionRate: string;
  totalContacts: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  metaDescription?: string;
  content: string;
  summary?: string;
  keywords?: string;
  seoTitle?: string;
  authorName?: string;
  status: 'draft' | 'published' | 'archived';
  category?: string;
  publishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  category: string;
  isActive: boolean;
  variables?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailHistory {
  id: string;
  templateId?: string;
  recipientEmail: string;
  recipientName?: string;
  senderEmail: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  errorMessage?: string;
  sentAt?: string;
  createdAt?: string;
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
    if (emailHistoryQuery.data) {
      setEmailHistory(emailHistoryQuery.data);
    }
  }, [emailHistoryQuery.data]);

  useEffect(() => {
    if (emailTemplatesQuery.data) {
      setEmailTemplates(emailTemplatesQuery.data);
    }
  }, [emailTemplatesQuery.data]);

  useEffect(() => {
    if (emailStatsQuery.data) {
      setEmailStats(emailStatsQuery.data);
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
      estimation_quick: { variant: "secondary" as const, label: "Estimation Rapide", color: "bg-blue-100 text-blue-800" },
      estimation_detailed: { variant: "default" as const, label: "Estimation Détaillée", color: "bg-green-100 text-green-800" },
      financing: { variant: "secondary" as const, label: "Financement", color: "bg-purple-100 text-purple-800" },
      guide_download: { variant: "outline" as const, label: "Guide Téléchargé", color: "bg-orange-100 text-orange-800" }
    };
    return variants[leadType as keyof typeof variants] || { variant: "outline" as const, label: leadType, color: "bg-gray-100 text-gray-800" };
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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || lead.status === selectedStatus;
    const matchesLeadType = selectedLeadType === "all" || lead.leadType === selectedLeadType;
    
    return matchesSearch && matchesStatus && matchesLeadType;
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Admin</h1>
            <p className="text-muted-foreground">
              Gestion des leads et estimations pour {domain}
            </p>
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
        </div>

        {/* Error Alert */}
        {authError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        {/* Main Content */}
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="leads" data-testid="tab-leads">Leads</TabsTrigger>
            <TabsTrigger value="estimations" data-testid="tab-estimations">Estimations</TabsTrigger>
            <TabsTrigger value="contacts" data-testid="tab-contacts">Messages</TabsTrigger>
            <TabsTrigger value="articles" data-testid="tab-articles">Articles</TabsTrigger>
            <TabsTrigger value="emails" data-testid="tab-emails">Emails</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-6">
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
                <h3 className="text-lg font-semibold">Leads récents</h3>
                <div className="space-y-4">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover-elevate"
                      data-testid={`card-lead-${lead.id}`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium">
                            {lead.firstName} {lead.lastName}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={getLeadTypeBadge(lead.leadType).variant}
                              className={`text-xs ${getLeadTypeBadge(lead.leadType).color}`}
                              data-testid={`badge-leadtype-${lead.id}`}
                            >
                              {getLeadTypeBadge(lead.leadType).label}
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
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{lead.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{lead.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{[lead.address, lead.city, lead.postalCode].filter(Boolean).join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-semibold">
                          {lead.estimatedValue ? parseFloat(lead.estimatedValue).toLocaleString() : 'N/A'} €
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.propertyType === 'house' ? 'Maison' : 'Appartement'} - {lead.surface || 'N/A'} m²
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" data-testid={`button-lead-actions-${lead.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="estimations" className="space-y-6">
            {/* Filters for Estimations */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par ville ou adresse..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-estimations"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                    data-testid="button-clear-search"
                  >
                    Tout afficher
                  </Button>
                </div>
              </div>
            </Card>

            {/* Estimations Table */}
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Estimations récentes</h3>
                <div className="space-y-4">
                  {estimations.filter(estimation => 
                    !searchTerm || 
                    estimation.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    estimation.address.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((estimation) => (
                    <div
                      key={estimation.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover-elevate"
                      data-testid={`card-estimation-${estimation.id}`}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium">
                            {estimation.address}, {estimation.city}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {estimation.propertyType === 'house' ? 'Maison' : 'Appartement'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <div className="h-3 w-3 bg-primary rounded-full" />
                            <span>{estimation.surface} m²</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="h-3 w-3 bg-secondary rounded-full" />
                            <span>{estimation.rooms} pièces</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="h-3 w-3 bg-green-500 rounded-full" />
                            <span>Confiance: {estimation.confidence}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Créée le {new Date(estimation.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-2xl font-bold text-primary">
                          {parseFloat(estimation.estimatedValue).toLocaleString()} €
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {parseFloat(estimation.pricePerM2).toLocaleString()} €/m²
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" data-testid={`button-estimation-actions-${estimation.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {estimations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune estimation pour le moment</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            {/* Filters for Contacts */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom, email ou sujet..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-contacts"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                    data-testid="button-clear-search"
                  >
                    Tout afficher
                  </Button>
                </div>
              </div>
            </Card>

            {/* Contacts Table */}
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Messages de contact</h3>
                <div className="space-y-4">
                  {contacts.filter(contact => 
                    !searchTerm || 
                    `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.subject.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((contact) => (
                    <div
                      key={contact.id}
                      className="flex flex-col md:flex-row gap-4 p-4 border border-border rounded-lg hover-elevate"
                      data-testid={`card-contact-${contact.id}`}
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">
                              {contact.firstName} {contact.lastName}
                            </h4>
                            <Badge variant={contact.status === 'new' ? 'default' : 'secondary'} className="text-xs">
                              {contact.status === 'new' ? 'Nouveau' : 'Traité'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(contact.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{contact.email}</span>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{contact.source}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-foreground">
                              Sujet: {contact.subject}
                            </div>
                            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                              {contact.message.length > 150 ? 
                                `${contact.message.substring(0, 150)}...` : 
                                contact.message
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-between items-end space-y-2">
                        <Button variant="ghost" size="icon" data-testid={`button-contact-actions-${contact.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {contact.message.length > 150 && (
                          <Button variant="outline" size="sm" data-testid={`button-view-full-message-${contact.id}`}>
                            <Eye className="h-3 w-3 mr-1" />
                            Voir tout
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {contacts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun message de contact pour le moment</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="articles" className="space-y-6">
            <Tabs value={activeArticleTab} onValueChange={setActiveArticleTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="liste" data-testid="tab-articles-liste">Liste</TabsTrigger>
                <TabsTrigger value="generation" data-testid="tab-articles-generation">Génération</TabsTrigger>
              </TabsList>

              <TabsContent value="liste" className="space-y-6">
                {/* Article Filters */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Rechercher par titre ou contenu..."
                            value={articleSearchTerm}
                            onChange={(e) => setArticleSearchTerm(e.target.value)}
                            className="pl-10"
                            data-testid="input-search-articles"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select value={articleStatus} onValueChange={setArticleStatus}>
                          <SelectTrigger className="w-40" data-testid="select-article-status">
                            <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="draft">Brouillons</SelectItem>
                            <SelectItem value="published">Publiés</SelectItem>
                            <SelectItem value="archived">Archivés</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={articleCategory} onValueChange={setArticleCategory}>
                          <SelectTrigger className="w-40" data-testid="select-article-category">
                            <SelectValue placeholder="Catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            <SelectItem value="estimation">Estimation</SelectItem>
                            <SelectItem value="marche">Marché</SelectItem>
                            <SelectItem value="conseils">Conseils</SelectItem>
                            <SelectItem value="financement">Financement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Articles List */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Articles ({articles.length})</h3>
                      <Button 
                        onClick={() => {
                          setArticleForm({
                            keyword: "",
                            wordCount: 800,
                            category: "estimation",
                            audience: "proprietaires",
                            tone: "professionnel"
                          });
                          setActiveArticleTab("generation");
                        }}
                        data-testid="button-create-article"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau
                      </Button>
                    </div>
                    
                    {articlesLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Chargement des articles...
                      </div>
                    ) : articles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun article trouvé</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {articles.map((article: Article) => (
                          <div
                            key={article.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover-elevate"
                            data-testid={`card-article-${article.id}`}
                          >
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium">{article.title}</h4>
                                <Badge 
                                  variant={
                                    article.status === 'published' ? 'default' : 
                                    article.status === 'draft' ? 'secondary' : 'outline'
                                  }
                                  data-testid={`badge-article-status-${article.id}`}
                                >
                                  {article.status === 'published' ? 'Publié' : 
                                   article.status === 'draft' ? 'Brouillon' : 'Archivé'}
                                </Badge>
                                {article.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>/{article.slug}</span>
                                <span>
                                  {article.publishedAt ? 
                                    new Date(article.publishedAt).toLocaleDateString('fr-FR') : 
                                    'Non publié'
                                  }
                                </span>
                                {article.summary && (
                                  <span className="truncate max-w-xs">{article.summary}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Close any open modals before opening preview
                                  setShowPreviewModal(false);
                                  setShowScheduleModal(false);
                                  setCalendarPopoverOpen(false);
                                  setPreviewingArticle(article);
                                  setShowArticlePreviewModal(true);
                                }}
                                data-testid={`button-preview-article-${article.id}`}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Prévisualiser
                              </Button>
                              {article.status === 'published' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/actualites/${article.slug}`, '_blank')}
                                  data-testid={`button-view-article-${article.id}`}
                                >
                                  <Globe className="h-3 w-3 mr-1" />
                                  Voir
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newStatus = article.status === 'published' ? 'draft' : 'published';
                                  updateArticleMutation.mutate({ id: article.id, status: newStatus });
                                }}
                                disabled={updateArticleMutation.isPending}
                                data-testid={`button-toggle-status-${article.id}`}
                              >
                                {article.status === 'published' ? 'Dépublier' : 'Publier'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
                                    deleteArticleMutation.mutate(article.id);
                                  }
                                }}
                                disabled={deleteArticleMutation.isPending}
                                data-testid={`button-delete-article-${article.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="generation" className="space-y-6">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Wand2 className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Générer un article avec IA</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="keyword">Mot-clé principal *</Label>
                          <Input
                            id="keyword"
                            placeholder="ex: estimation immobilière Bordeaux"
                            value={articleForm.keyword}
                            onChange={(e) => setArticleForm({ ...articleForm, keyword: e.target.value })}
                            disabled={generateArticleMutation.isPending}
                            data-testid="input-article-keyword"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="wordCount">Nombre de mots</Label>
                          <Select 
                            value={articleForm.wordCount.toString()} 
                            onValueChange={(value) => setArticleForm({ ...articleForm, wordCount: parseInt(value) })}
                            disabled={generateArticleMutation.isPending}
                          >
                            <SelectTrigger data-testid="select-word-count">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="400">400 mots</SelectItem>
                              <SelectItem value="600">600 mots</SelectItem>
                              <SelectItem value="800">800 mots</SelectItem>
                              <SelectItem value="1000">1000 mots</SelectItem>
                              <SelectItem value="1200">1200 mots</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="category">Catégorie</Label>
                          <Select 
                            value={articleForm.category} 
                            onValueChange={(value) => setArticleForm({ ...articleForm, category: value })}
                            disabled={generateArticleMutation.isPending}
                          >
                            <SelectTrigger data-testid="select-generation-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="estimation">Estimation</SelectItem>
                              <SelectItem value="marche">Marché</SelectItem>
                              <SelectItem value="conseils">Conseils</SelectItem>
                              <SelectItem value="financement">Financement</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="audience">Audience</Label>
                          <Select 
                            value={articleForm.audience} 
                            onValueChange={(value) => setArticleForm({ ...articleForm, audience: value })}
                            disabled={generateArticleMutation.isPending}
                          >
                            <SelectTrigger data-testid="select-generation-audience">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="proprietaires">Propriétaires</SelectItem>
                              <SelectItem value="investisseurs">Investisseurs</SelectItem>
                              <SelectItem value="acheteurs">Acheteurs</SelectItem>
                              <SelectItem value="vendeurs">Vendeurs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="tone">Ton</Label>
                          <Select 
                            value={articleForm.tone} 
                            onValueChange={(value) => setArticleForm({ ...articleForm, tone: value })}
                            disabled={generateArticleMutation.isPending}
                          >
                            <SelectTrigger data-testid="select-generation-tone">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professionnel">Professionnel</SelectItem>
                              <SelectItem value="accessible">Accessible</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                              <SelectItem value="conseil">Conseil</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="pt-4">
                          <Button
                            onClick={() => {
                              if (!articleForm.keyword) {
                                alert('Le mot-clé principal est requis');
                                return;
                              }
                              setGeneratingArticle(true);
                              generateArticleMutation.mutate(articleForm);
                            }}
                            disabled={!articleForm.keyword || generateArticleMutation.isPending}
                            className="w-full"
                            data-testid="button-generate-article"
                          >
                            {generateArticleMutation.isPending ? (
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
                          
                          {/* Progress Indicator */}
                          {generateArticleMutation.isPending && (
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{generationStep}</span>
                                <span className="text-muted-foreground">{generationProgress}%</span>
                              </div>
                              <Progress 
                                value={generationProgress} 
                                className="w-full" 
                                data-testid="progress-article-generation"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gestion des Emails</h2>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/email/test-connection', { method: 'POST' });
                    const result = await response.json();
                    if (result.success) {
                      alert('✅ Connexion SMTP réussie !');
                    } else {
                      alert(`❌ Erreur SMTP: ${result.error}`);
                    }
                  } catch (error) {
                    alert('❌ Erreur de connexion au serveur');
                  }
                }}
                data-testid="button-test-smtp"
              >
                <Settings className="h-4 w-4 mr-2" />
                Tester SMTP
              </Button>
            </div>

            <Tabs value={activeEmailTab} onValueChange={setActiveEmailTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="history" data-testid="tab-email-history">Historique</TabsTrigger>
                <TabsTrigger value="templates" data-testid="tab-email-templates">Templates</TabsTrigger>
                <TabsTrigger value="test" data-testid="tab-email-test">Test Email</TabsTrigger>
                <TabsTrigger value="stats" data-testid="tab-email-stats">Statistiques</TabsTrigger>
              </TabsList>

              {/* Email History Tab */}
              <TabsContent value="history" className="space-y-6">
                {/* Email History Filters */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Rechercher par email ou objet..."
                            value={emailSearchTerm}
                            onChange={(e) => setEmailSearchTerm(e.target.value)}
                            className="pl-10"
                            data-testid="input-search-emails"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select value={emailStatusFilter} onValueChange={setEmailStatusFilter}>
                          <SelectTrigger className="w-32" data-testid="select-email-status">
                            <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="sent">Envoyé</SelectItem>
                            <SelectItem value="failed">Échec</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={emailCategoryFilter} onValueChange={setEmailCategoryFilter}>
                          <SelectTrigger className="w-40" data-testid="select-email-category">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="contact_confirmation">Contact - Confirmation</SelectItem>
                            <SelectItem value="estimation_confirmation">Estimation - Confirmation</SelectItem>
                            <SelectItem value="admin_notification">Admin - Notification</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Email History List */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Historique des emails ({emailHistoryQuery.data?.length || 0})</h3>
                      <Badge variant="outline" className="text-xs">
                        {emailStats && `${emailStats.totalSent} envoyés aujourd'hui`}
                      </Badge>
                    </div>
                    
                    {emailHistoryQuery.isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                        Chargement des emails...
                      </div>
                    ) : emailHistory.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun email trouvé</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {emailHistory.map((email: EmailHistory) => (
                          <div
                            key={email.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover-elevate"
                            data-testid={`card-email-${email.id}`}
                          >
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                <Badge 
                                  variant={
                                    email.status === 'sent' ? 'default' : 
                                    email.status === 'failed' ? 'destructive' : 'secondary'
                                  }
                                  data-testid={`badge-email-status-${email.id}`}
                                >
                                  {email.status === 'sent' ? '✓ Envoyé' : 
                                   email.status === 'failed' ? '✗ Échec' : '⏳ En attente'}
                                </Badge>
                                <h4 className="font-medium truncate">{email.subject}</h4>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{email.recipientEmail}</span>
                                </div>
                                {email.recipientName && (
                                  <span>{email.recipientName}</span>
                                )}
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {email.sentAt ? 
                                      new Date(email.sentAt).toLocaleString('fr-FR') : 
                                      new Date(email.createdAt!).toLocaleString('fr-FR')
                                    }
                                  </span>
                                </div>
                              </div>
                              {email.errorMessage && (
                                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                                  Erreur: {email.errorMessage}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // TODO: Show email content in modal
                                  console.log('Preview email:', email);
                                }}
                                data-testid={`button-preview-email-${email.id}`}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Voir
                              </Button>
                              {email.status === 'failed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Retry sending email
                                    console.log('Retry email:', email);
                                  }}
                                  data-testid={`button-retry-email-${email.id}`}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Réessayer
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Email Templates Tab */}
              <TabsContent value="templates" className="space-y-6">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Templates d'email ({emailTemplatesQuery.data?.length || 0})</h3>
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
                        data-testid="button-create-template"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau Template
                      </Button>
                    </div>
                    
                    {emailTemplatesQuery.isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                        Chargement des templates...
                      </div>
                    ) : emailTemplates.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun template trouvé</p>
                        <Button
                          className="mt-4"
                          onClick={() => {
                            // TODO: Seed default templates
                            console.log('Seeding default templates');
                          }}
                        >
                          Créer les templates par défaut
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {emailTemplates.map((template: EmailTemplate) => (
                          <div
                            key={template.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover-elevate"
                            data-testid={`card-template-${template.id}`}
                          >
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-medium">{template.name}</h4>
                                <Badge 
                                  variant={template.isActive ? 'default' : 'secondary'}
                                  data-testid={`badge-template-status-${template.id}`}
                                >
                                  {template.isActive ? 'Actif' : 'Inactif'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {template.category}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <div className="font-medium">Objet: {template.subject}</div>
                                <div className="text-xs mt-1">
                                  Variables: {JSON.parse(template.variables || '[]').join(', ') || 'Aucune'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setShowTestEmailModal(true);
                                }}
                                data-testid={`button-test-template-${template.id}`}
                              >
                                <TestTube className="h-3 w-3 mr-1" />
                                Tester
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTemplateForm({
                                    name: template.name,
                                    subject: template.subject,
                                    htmlContent: template.htmlContent,
                                    textContent: template.textContent,
                                    category: template.category,
                                    isActive: template.isActive,
                                    variables: template.variables || "[]"
                                  });
                                  setSelectedTemplate(template);
                                  setShowTemplateModal(true);
                                }}
                                data-testid={`button-edit-template-${template.id}`}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
                                    // TODO: Delete template
                                    console.log('Delete template:', template.id);
                                  }
                                }}
                                data-testid={`button-delete-template-${template.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Test Email Tab */}
              <TabsContent value="test" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Envoyer un email de test</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="test-template">Template à tester</Label>
                        <Select 
                          value={selectedTemplate?.id || ""} 
                          onValueChange={(value) => {
                            const template = emailTemplates.find(t => t.id === value);
                            setSelectedTemplate(template || null);
                          }}
                        >
                          <SelectTrigger data-testid="select-test-template">
                            <SelectValue placeholder="Choisir un template" />
                          </SelectTrigger>
                          <SelectContent>
                            {emailTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="test-email">Email destinataire</Label>
                        <Input
                          id="test-email"
                          type="email"
                          value={testEmailForm.email}
                          onChange={(e) => setTestEmailForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="admin@estimation-immobilier-gironde.fr"
                          data-testid="input-test-email"
                        />
                      </div>

                      <div>
                        <Label htmlFor="test-name">Nom destinataire (optionnel)</Label>
                        <Input
                          id="test-name"
                          value={testEmailForm.name}
                          onChange={(e) => setTestEmailForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Jean Dupont"
                          data-testid="input-test-name"
                        />
                      </div>

                      <Button
                        onClick={async () => {
                          if (!selectedTemplate || !testEmailForm.email) {
                            alert('Veuillez sélectionner un template et saisir un email');
                            return;
                          }
                          
                          try {
                            const response = await fetch('/api/email/test', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                templateId: selectedTemplate.id,
                                email: testEmailForm.email,
                                name: testEmailForm.name
                              })
                            });
                            
                            const result = await response.json();
                            if (result.success) {
                              alert('✅ Email de test envoyé avec succès !');
                            } else {
                              alert(`❌ Erreur: ${result.error}`);
                            }
                          } catch (error) {
                            alert('❌ Erreur de connexion au serveur');
                          }
                        }}
                        disabled={!selectedTemplate || !testEmailForm.email}
                        className="w-full"
                        data-testid="button-send-test-email"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer le test
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Aperçu du template</h3>
                    {selectedTemplate ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <Label className="text-xs font-semibold text-muted-foreground">OBJET</Label>
                          <div className="font-medium mt-1">{selectedTemplate.subject}</div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <Label className="text-xs font-semibold text-muted-foreground">CATÉGORIE</Label>
                          <div className="mt-1">{selectedTemplate.category}</div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <Label className="text-xs font-semibold text-muted-foreground">VARIABLES DISPONIBLES</Label>
                          <div className="text-sm mt-1">
                            {JSON.parse(selectedTemplate.variables || '[]').join(', ') || 'Aucune variable'}
                          </div>
                        </div>
                        
                        <div className="border rounded-lg max-h-64 overflow-y-auto">
                          <div className="p-2 border-b bg-muted/50">
                            <Label className="text-xs font-semibold">CONTENU HTML</Label>
                          </div>
                          <div 
                            className="p-4 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: selectedTemplate.htmlContent.replace(/\{\{/g, '<span class="bg-yellow-200 px-1 rounded">{{').replace(/\}\}/g, '}}</span>')
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Sélectionnez un template pour voir l'aperçu
                      </div>
                    )}
                  </Card>
                </div>
              </TabsContent>

              {/* Email Statistics Tab */}
              <TabsContent value="stats" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-6">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{emailStats?.totalSent || 0}</p>
                        <p className="text-xs text-muted-foreground">Total envoyés</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{emailStats?.sentToday || 0}</p>
                        <p className="text-xs text-muted-foreground">Envoyés aujourd'hui</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold">{emailStats?.totalFailed || 0}</p>
                        <p className="text-xs text-muted-foreground">Échecs</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold">{emailStats?.successRate || '0%'}</p>
                        <p className="text-xs text-muted-foreground">Taux de réussite</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Activité récente</h3>
                  <div className="space-y-4">
                    {emailHistory.slice(0, 10).map((email) => (
                      <div key={email.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={email.status === 'sent' ? 'default' : email.status === 'failed' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {email.status}
                          </Badge>
                          <span className="text-sm">{email.recipientEmail}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {email.sentAt ? new Date(email.sentAt).toLocaleTimeString('fr-FR') : 
                           new Date(email.createdAt!).toLocaleTimeString('fr-FR')}
                        </span>
                      </div>
                    ))}
                    {emailHistory.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Aucune activité récente</p>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Template Modal */}
        <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="modal-template-title">
                {selectedTemplate ? 'Modifier le Template' : 'Nouveau Template'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Nom du template</Label>
                  <Input
                    id="template-name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Confirmation contact client"
                    data-testid="input-template-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-category">Catégorie</Label>
                  <Select value={templateForm.category} onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger data-testid="select-template-category">
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contact_confirmation">Contact - Confirmation</SelectItem>
                      <SelectItem value="estimation_confirmation">Estimation - Confirmation</SelectItem>
                      <SelectItem value="financing_confirmation">Financement - Confirmation</SelectItem>
                      <SelectItem value="admin_notification">Admin - Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="template-subject">Objet de l'email</Label>
                <Input
                  id="template-subject"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Merci pour votre demande {{firstName}}"
                  data-testid="input-template-subject"
                />
              </div>

              <div>
                <Label htmlFor="template-html">Contenu HTML</Label>
                <Textarea
                  id="template-html"
                  value={templateForm.htmlContent}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, htmlContent: e.target.value }))}
                  placeholder="<h2>Bonjour {{firstName}}</h2><p>Merci pour votre demande...</p>"
                  className="min-h-64 font-mono text-sm"
                  data-testid="textarea-template-html"
                />
              </div>

              <div>
                <Label htmlFor="template-text">Version texte</Label>
                <Textarea
                  id="template-text"
                  value={templateForm.textContent}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, textContent: e.target.value }))}
                  placeholder="Bonjour {{firstName}}, merci pour votre demande..."
                  className="min-h-32"
                  data-testid="textarea-template-text"
                />
              </div>

              <div>
                <Label htmlFor="template-variables">Variables disponibles (JSON)</Label>
                <Input
                  id="template-variables"
                  value={templateForm.variables}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, variables: e.target.value }))}
                  placeholder='["firstName", "lastName", "email", "phone"]'
                  data-testid="input-template-variables"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="template-active"
                  checked={templateForm.isActive}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  data-testid="checkbox-template-active"
                />
                <Label htmlFor="template-active">Template actif</Label>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateModal(false)}
                  data-testid="button-cancel-template"
                >
                  Annuler
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const method = selectedTemplate ? 'PUT' : 'POST';
                      const url = selectedTemplate ? `/api/email/templates/${selectedTemplate.id}` : '/api/email/templates';
                      
                      const response = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(templateForm)
                      });

                      if (response.ok) {
                        queryClientInstance.invalidateQueries({ queryKey: ['/api/email/templates'] });
                        setShowTemplateModal(false);
                        alert('Template sauvegardé avec succès !');
                      } else {
                        alert('Erreur lors de la sauvegarde du template');
                      }
                    } catch (error) {
                      alert('Erreur de connexion au serveur');
                    }
                  }}
                  data-testid="button-save-template"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Test Email Modal */}
        <Dialog open={showTestEmailModal} onOpenChange={setShowTestEmailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle data-testid="modal-test-email-title">
                Tester le template: {selectedTemplate?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-recipient-email">Email destinataire</Label>
                <Input
                  id="test-recipient-email"
                  type="email"
                  value={testEmailForm.email}
                  onChange={(e) => setTestEmailForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="test@estimation-immobilier-gironde.fr"
                  data-testid="input-test-recipient-email"
                />
              </div>

              <div>
                <Label htmlFor="test-recipient-name">Nom destinataire</Label>
                <Input
                  id="test-recipient-name"
                  value={testEmailForm.name}
                  onChange={(e) => setTestEmailForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Jean Dupont"
                  data-testid="input-test-recipient-name"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowTestEmailModal(false)}
                  data-testid="button-cancel-test-email"
                >
                  Annuler
                </Button>
                <Button
                  onClick={async () => {
                    if (!selectedTemplate || !testEmailForm.email) return;
                    
                    try {
                      const response = await fetch('/api/email/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          templateId: selectedTemplate.id,
                          email: testEmailForm.email,
                          name: testEmailForm.name,
                          variables: {
                            firstName: testEmailForm.name.split(' ')[0] || 'Test',
                            lastName: testEmailForm.name.split(' ').slice(1).join(' ') || 'User',
                            email: testEmailForm.email
                          }
                        })
                      });

                      const result = await response.json();
                      if (result.success) {
                        alert('✅ Email de test envoyé avec succès !');
                        setShowTestEmailModal(false);
                      } else {
                        alert(`❌ Erreur: ${result.error}`);
                      }
                    } catch (error) {
                      alert('❌ Erreur de connexion au serveur');
                    }
                  }}
                  disabled={!selectedTemplate || !testEmailForm.email}
                  data-testid="button-send-test-email-modal"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer le test
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Email Modal */}
        <Dialog open={showBulkEmailModal} onOpenChange={setShowBulkEmailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle data-testid="modal-bulk-email-title">
                Envoi en masse
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-template">Template à utiliser</Label>
                <Select value={bulkEmailForm.templateId} onValueChange={(value) => setBulkEmailForm(prev => ({ ...prev, templateId: value }))}>
                  <SelectTrigger data-testid="select-bulk-template">
                    <SelectValue placeholder="Choisir un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.filter(t => t.isActive).map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bulk-recipients">Emails destinataires (un par ligne)</Label>
                <Textarea
                  id="bulk-recipients"
                  value={bulkEmailForm.recipients}
                  onChange={(e) => setBulkEmailForm(prev => ({ ...prev, recipients: e.target.value }))}
                  placeholder="email1@example.com&#10;email2@example.com"
                  className="min-h-32"
                  data-testid="textarea-bulk-recipients"
                />
              </div>

              <div>
                <Label htmlFor="bulk-delay">Délai entre envois (ms)</Label>
                <Input
                  id="bulk-delay"
                  type="number"
                  value={bulkEmailForm.delay}
                  onChange={(e) => setBulkEmailForm(prev => ({ ...prev, delay: parseInt(e.target.value) || 1000 }))}
                  min="100"
                  data-testid="input-bulk-delay"
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkEmailModal(false)}
                  data-testid="button-cancel-bulk-email"
                >
                  Annuler
                </Button>
                <Button
                  onClick={async () => {
                    if (!bulkEmailForm.templateId || !bulkEmailForm.recipients.trim()) return;
                    
                    try {
                      const response = await fetch('/api/email/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bulkEmailForm)
                      });

                      const result = await response.json();
                      if (result.success) {
                        alert(`✅ ${result.sent} emails envoyés avec succès !`);
                        setShowBulkEmailModal(false);
                        queryClientInstance.invalidateQueries({ queryKey: ['/api/email/history'] });
                      } else {
                        alert(`❌ Erreur: ${result.error}`);
                      }
                    } catch (error) {
                      alert('❌ Erreur de connexion au serveur');
                    }
                  }}
                  disabled={!bulkEmailForm.templateId || !bulkEmailForm.recipients.trim()}
                  data-testid="button-send-bulk-emails"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer en masse
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Preview Modal for Generated Articles */}
        <Dialog 
          open={showPreviewModal} 
          onOpenChange={(open) => {
            setShowPreviewModal(open);
            if (!open) {
              setPreviewArticle(null);
            }
          }}
        >
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle data-testid="modal-preview-title" className="text-xl font-bold">
                Prévisualisation de l'article généré
              </DialogTitle>
            </DialogHeader>
            
            {previewArticle && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Fixed Header - Article Metadata Section */}
                <div className="flex-shrink-0 space-y-4 pb-4 border-b">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs font-semibold text-muted-foreground">TITRE</Label>
                        <div className="font-semibold mt-1">{previewArticle.title}</div>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs font-semibold text-muted-foreground">URL</Label>
                        <div className="text-sm text-blue-600 font-mono mt-1">/{previewArticle.slug}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs font-semibold text-muted-foreground">META DESCRIPTION</Label>
                        <div className="text-sm mt-1 leading-relaxed">{previewArticle.metaDescription}</div>
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <Label className="text-xs font-semibold text-muted-foreground">MOTS-CLÉS</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {previewArticle.keywords.slice(0, 4).map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {previewArticle.keywords.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{previewArticle.keywords.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Scrollable Content Preview Section */}
                <div className="flex-1 overflow-hidden flex flex-col pt-4">
                  <Label className="text-lg font-semibold mb-3 flex-shrink-0">Aperçu du contenu</Label>
                  <div className="flex-1 border border-border rounded-lg overflow-hidden bg-white dark:bg-card">
                    <div className="bg-muted/30 px-4 py-2 border-b flex-shrink-0">
                      <span className="text-sm text-muted-foreground">Contenu HTML généré</span>
                    </div>
                    <div className="h-full overflow-y-auto">
                      <div 
                        className="prose prose-sm max-w-none p-6"
                        dangerouslySetInnerHTML={{ __html: previewArticle.content }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Fixed Footer - Action Buttons Section */}
                <div className="flex-shrink-0 border-t pt-4 mt-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPreviewModal(false);
                        setPreviewArticle(null);
                      }}
                      disabled={createArticleMutation.isPending}
                      data-testid="button-cancel-preview"
                      className="order-1 sm:order-none"
                    >
                      Annuler
                    </Button>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          createArticleMutation.mutate({
                            ...previewArticle,
                            status: 'draft',
                            keywords: JSON.stringify(previewArticle.keywords)
                          });
                        }}
                        disabled={createArticleMutation.isPending}
                        data-testid="button-save-draft"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Brouillon
                      </Button>
                      
                      <Button
                        variant="secondary"
                        onClick={() => {
                          // Close preview modal and open schedule modal exclusively
                          setShowPreviewModal(false);
                          setShowScheduleModal(true);
                          setCalendarPopoverOpen(false);
                        }}
                        disabled={createArticleMutation.isPending}
                        data-testid="button-schedule-publication"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Planifier
                      </Button>
                      
                      <Button
                        onClick={() => {
                          createArticleMutation.mutate({
                            ...previewArticle,
                            status: 'published',
                            publishedAt: new Date().toISOString(),
                            keywords: JSON.stringify(previewArticle.keywords)
                          });
                        }}
                        disabled={createArticleMutation.isPending}
                        data-testid="button-publish-now"
                      >
                        {createArticleMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Globe className="h-4 w-4 mr-2" />
                        )}
                        Publier
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Publication Scheduling Modal - Only render when showScheduleModal is true */}
        {showScheduleModal && (
          <Dialog 
            open={showScheduleModal} 
            onOpenChange={(open) => {
              setShowScheduleModal(open);
              if (!open) {
                setCalendarPopoverOpen(false);
                setScheduledDate(new Date());
                setScheduledTime("09:00");
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle data-testid="modal-schedule-title">Planifier la publication</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Date de publication</Label>
                  <Popover open={calendarPopoverOpen} onOpenChange={setCalendarPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-select-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? scheduledDate.toLocaleDateString('fr-FR') : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={(date) => {
                          setScheduledDate(date);
                          setCalendarPopoverOpen(false);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Heure de publication</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    data-testid="input-schedule-time"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowScheduleModal(false);
                      setCalendarPopoverOpen(false);
                      // Re-open preview modal if article exists
                      if (previewArticle) {
                        setShowPreviewModal(true);
                      }
                    }}
                    className="flex-1"
                    data-testid="button-cancel-schedule"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={() => {
                      if (scheduledDate && previewArticle) {
                        const [hours, minutes] = scheduledTime.split(':');
                        const scheduledDateTime = new Date(scheduledDate);
                        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));
                        
                        createArticleMutation.mutate({
                          ...previewArticle,
                          status: 'published',
                          publishedAt: scheduledDateTime.toISOString(),
                          keywords: JSON.stringify(previewArticle.keywords)
                        });
                      }
                    }}
                    disabled={!scheduledDate || createArticleMutation.isPending}
                    className="flex-1"
                    data-testid="button-confirm-schedule"
                  >
                    {createArticleMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4 mr-2" />
                    )}
                    Planifier
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Article Preview Modal */}
        <Dialog 
          open={showArticlePreviewModal} 
          onOpenChange={(open) => {
            setShowArticlePreviewModal(open);
            if (!open) {
              setPreviewingArticle(null);
              // Ensure other modals are closed
              setShowScheduleModal(false);
              setCalendarPopoverOpen(false);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="modal-article-preview-title" className="text-xl font-bold">
                Prévisualisation de l'article
              </DialogTitle>
            </DialogHeader>
            
            {previewingArticle && (
              <div className="space-y-6">
                {/* Article Header Section */}
                <div className="border-b pb-4">
                  <div className="flex items-center gap-4 mb-3">
                    <Badge 
                      variant={previewingArticle.status === 'published' ? 'default' : 'secondary'}
                      data-testid="badge-preview-status"
                    >
                      {previewingArticle.status === 'published' ? 'Publié' : 'Brouillon'}
                    </Badge>
                    {previewingArticle.category && (
                      <Badge variant="outline" className="text-xs">
                        {previewingArticle.category.charAt(0).toUpperCase() + previewingArticle.category.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" data-testid="text-preview-title">
                    {previewingArticle.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {previewingArticle.publishedAt ? 
                        new Date(previewingArticle.publishedAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 
                        'Non publié'
                      }
                    </div>
                    {previewingArticle.authorName && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Par {previewingArticle.authorName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta Description */}
                {previewingArticle.metaDescription && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {previewingArticle.metaDescription}
                    </p>
                  </div>
                )}

                {/* Article Content */}
                <div className="space-y-6">
                  <div className="bg-background border rounded-lg">
                    <div className="p-4 border-b">
                      <Label className="text-sm font-semibold text-muted-foreground">CONTENU DE L'ARTICLE</Label>
                    </div>
                    <div 
                      className="prose prose-sm lg:prose-base max-w-none p-6 bg-white dark:bg-card"
                      dangerouslySetInnerHTML={{ __html: previewingArticle.content }}
                      data-testid="content-preview-article"
                    />
                  </div>
                </div>

                {/* Preview Actions */}
                <div className="flex justify-between items-center pt-4 border-t gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowArticlePreviewModal(false);
                      setPreviewingArticle(null);
                    }}
                    data-testid="button-close-preview"
                  >
                    Fermer
                  </Button>
                  
                  <div className="flex gap-2">
                    {previewingArticle.status === 'published' && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          window.open(`/actualites/${previewingArticle.slug}`, '_blank');
                        }}
                        data-testid="button-view-live-article"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Voir en direct
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => {
                        const newStatus = previewingArticle.status === 'published' ? 'draft' : 'published';
                        updateArticleMutation.mutate({ 
                          id: previewingArticle.id, 
                          status: newStatus,
                          publishedAt: newStatus === 'published' ? new Date().toISOString() : undefined
                        });
                        setShowArticlePreviewModal(false);
                      }}
                      disabled={updateArticleMutation.isPending}
                      data-testid="button-toggle-status-preview"
                    >
                      {updateArticleMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      {previewingArticle.status === 'published' ? 'Dépublier' : 'Publier'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}