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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
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
  Globe
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<GeneratedArticle | null>(null);
  const [generatingArticle, setGeneratingArticle] = useState(false);

  // Article generation form state
  const [articleForm, setArticleForm] = useState({
    keyword: "",
    wordCount: 800,
    category: "estimation",
    audience: "proprietaires",
    tone: "professionnel"
  });

  const queryClientInstance = useQueryClient();

  // React Query hooks for articles
  const { data: articles = [], isLoading: articlesLoading, error: articlesError } = useQuery<Article[]>({
    queryKey: ['/api/admin/articles', { status: articleStatus, category: articleCategory, q: articleSearchTerm }],
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
      setShowPreviewModal(false);
      setPreviewArticle(null);
    }
  });

  const updateArticleMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<Article>) => {
      const response = await apiRequest('PATCH', `/api/admin/articles/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/admin/articles'] });
    }
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/articles/${id}`);
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/admin/articles'] });
    }
  });

  const generateArticleMutation = useMutation({
    mutationFn: async (formData: typeof articleForm) => {
      const response = await apiRequest('POST', '/api/admin/articles/generate', formData);
      return response.json();
    },
    onSuccess: (data: GeneratedArticle) => {
      setPreviewArticle(data);
      setShowPreviewModal(true);
      setGeneratingArticle(false);
    },
    onError: () => {
      setGeneratingArticle(false);
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="leads" data-testid="tab-leads">Leads</TabsTrigger>
            <TabsTrigger value="estimations" data-testid="tab-estimations">Estimations</TabsTrigger>
            <TabsTrigger value="contacts" data-testid="tab-contacts">Messages</TabsTrigger>
            <TabsTrigger value="articles" data-testid="tab-articles">Articles</TabsTrigger>
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
            <Tabs defaultValue="liste" className="space-y-6">
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
                              {article.status === 'published' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/articles/${article.slug}`, '_blank')}
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
                            data-testid="input-article-keyword"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="wordCount">Nombre de mots</Label>
                          <Select 
                            value={articleForm.wordCount.toString()} 
                            onValueChange={(value) => setArticleForm({ ...articleForm, wordCount: parseInt(value) })}
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
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Génération en cours...
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-4 w-4 mr-2" />
                                Générer l'article
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Preview Modal for Generated Articles */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="modal-preview-title">
                Prévisualisation de l'article généré
              </DialogTitle>
            </DialogHeader>
            
            {previewArticle && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Titre</Label>
                    <div className="font-semibold text-lg">{previewArticle.title}</div>
                  </div>
                  
                  <div>
                    <Label>Slug URL</Label>
                    <div className="text-sm text-muted-foreground">/{previewArticle.slug}</div>
                  </div>
                  
                  <div>
                    <Label>Meta Description</Label>
                    <div className="text-sm">{previewArticle.metaDescription}</div>
                  </div>
                  
                  {previewArticle.summary && (
                    <div>
                      <Label>Résumé</Label>
                      <div className="text-sm">{previewArticle.summary}</div>
                    </div>
                  )}
                  
                  <div>
                    <Label>Mots-clés</Label>
                    <div className="flex flex-wrap gap-1">
                      {previewArticle.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Contenu (aperçu)</Label>
                    <div 
                      className="prose prose-sm max-w-none border border-border rounded-md p-4 max-h-60 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: previewArticle.content.substring(0, 1000) + '...' }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPreviewModal(false);
                      setPreviewArticle(null);
                    }}
                    data-testid="button-cancel-preview"
                  >
                    Annuler
                  </Button>
                  <Button
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
                    Enregistrer brouillon
                  </Button>
                  <Button
                    onClick={() => {
                      createArticleMutation.mutate({
                        ...previewArticle,
                        status: 'published',
                        publishedAt: new Date(),
                        keywords: JSON.stringify(previewArticle.keywords)
                      });
                    }}
                    disabled={createArticleMutation.isPending}
                    data-testid="button-publish-article"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Publier
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}