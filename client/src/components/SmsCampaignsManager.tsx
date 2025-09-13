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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare,
  Send,
  Users,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Calendar as CalendarIcon,
  Settings,
  Eye,
  Copy,
  Download,
  Upload,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Target,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Types
interface SmsOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesClicked: number;
  totalUnsubscribes: number;
  deliveryRate: number;
  clickRate: number;
  unsubscribeRate: number;
  totalCost: number;
  averageCostPerMessage: number;
  totalConversions: number;
  conversionRate: number;
  roi: number;
}

interface SmsCampaign {
  id: string;
  name: string;
  message: string;
  status: string;
  audiencePersona?: string;
  audienceSize: number;
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  sentCount: number;
  deliveredCount: number;
  clickedCount: number;
  conversionCount: number;
  estimatedCost: string;
  actualCost?: string;
  roi?: string;
}

interface SmsTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  persona: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  conversionRate?: number;
  lastUsed?: Date;
  createdAt: Date;
}

interface SmsContact {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  persona: string;
  city: string;
  isOptedIn: boolean;
  optInDate: Date;
  optOutDate?: Date;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesClicked: number;
  conversionCount: number;
  lastContactDate?: Date;
  createdAt: Date;
}

const PERSONAS = [
  { value: "presse", label: "Pressé", color: "bg-red-500" },
  { value: "maximisateur", label: "Maximisateur", color: "bg-blue-500" },
  { value: "heritier_vendeur", label: "Héritier vendeur", color: "bg-green-500" },
  { value: "primo_acheteur", label: "Primo-accédant", color: "bg-yellow-500" },
  { value: "investisseur", label: "Investisseur", color: "bg-purple-500" }
];

const CAMPAIGN_STATUS_COLORS = {
  draft: "bg-gray-500",
  scheduled: "bg-blue-500", 
  sending: "bg-orange-500",
  completed: "bg-green-500",
  failed: "bg-red-500"
};

const SMS_TEMPLATES = {
  welcome: "Bonjour {prenom} ! Merci pour votre intérêt. Votre estimation gratuite arrive bientôt. Questions ? Répondez STOP pour vous désabonner.",
  estimation_ready: "🏠 {prenom}, votre estimation pour {ville} est prête ! Prix estimé: {prix_estimation}€. Consultez le détail: {lien}. STOP=désabo",
  follow_up: "Bonjour {prenom}, avez-vous eu le temps de consulter votre estimation de {ville} ? Nos experts restent à votre disposition. STOP=désabo",
  new_guide: "📖 Nouveau guide disponible ! \"{titre_guide}\" spécialement pour {persona}. Téléchargement gratuit: {lien}. STOP=désabo",
  urgency: "⏰ Opportunité limitée ! {prenom}, le marché de {ville} évolue rapidement. Estimation gratuite avant hausse: {lien}. STOP=désabo"
};

export default function SmsCampaignsManager() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCampaign, setSelectedCampaign] = useState<SmsCampaign | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SmsTemplate | null>(null);
  const [selectedContact, setSelectedContact] = useState<SmsContact | null>(null);
  const [newCampaignDialog, setNewCampaignDialog] = useState(false);
  const [newTemplateDialog, setNewTemplateDialog] = useState(false);
  const [contactImportDialog, setContactImportDialog] = useState(false);
  const [filterPersona, setFilterPersona] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    message: "",
    audiencePersona: "",
    scheduledAt: null as Date | null,
    templateId: ""
  });

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    content: "",
    category: "marketing",
    persona: "",
    isActive: true
  });

  // Queries
  const { data: smsOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/admin/sms/analytics/overview'],
    staleTime: 5 * 60 * 1000
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/admin/sms/campaigns'],
    staleTime: 5 * 60 * 1000
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/admin/sms/templates'],
    staleTime: 10 * 60 * 1000
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['/api/admin/sms/contacts'],
    staleTime: 10 * 60 * 1000
  });

  // Mutations
  const createCampaignMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/sms/campaigns', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/campaigns'] });
      setNewCampaignDialog(false);
      setCampaignForm({ name: "", message: "", audiencePersona: "", scheduledAt: null, templateId: "" });
      toast({ title: "Succès", description: "Campagne créée avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  const sendCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => apiRequest(`/api/admin/sms/campaigns/${campaignId}/send`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/campaigns'] });
      toast({ title: "Succès", description: "Campagne envoyée avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/sms/templates', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sms/templates'] });
      setNewTemplateDialog(false);
      setTemplateForm({ name: "", content: "", category: "marketing", persona: "", isActive: true });
      toast({ title: "Succès", description: "Template créé avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Helper functions
  const getStatusColor = (status: string) => CAMPAIGN_STATUS_COLORS[status] || "bg-gray-500";
  
  const getPersonaColor = (persona: string) => 
    PERSONAS.find(p => p.value === persona)?.color || "bg-gray-500";

  const countSmsCharacters = (text: string) => text.length;
  const getSmsCount = (text: string) => Math.ceil(text.length / 160);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Filter contacts based on persona and search
  const filteredContacts = contacts?.filter((contact: SmsContact) => {
    const matchesPersona = !filterPersona || contact.persona === filterPersona;
    const matchesSearch = !searchQuery || 
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery) ||
      contact.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPersona && matchesSearch;
  });

  // SMS Dashboard Component
  const SmsDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Dashboard SMS</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-refresh-dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {overviewLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-total-campaigns">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campagnes totales</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{smsOverview?.totalCampaigns || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {smsOverview?.activeCampaigns || 0} actives
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-messages-sent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages envoyés</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{smsOverview?.totalMessagesSent || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Taux de livraison: {formatPercent(smsOverview?.deliveryRate || 0)}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-conversion-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de conversion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(smsOverview?.conversionRate || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {smsOverview?.totalConversions || 0} conversions
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-roi">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(smsOverview?.roi || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Coût: {formatCurrency(smsOverview?.totalCost || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card data-testid="card-performance-chart">
            <CardHeader>
              <CardTitle>Performance des campagnes</CardTitle>
              <CardDescription>
                Analyse des performances sur les 30 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taux de livraison</span>
                  <span className="font-medium">{formatPercent(smsOverview?.deliveryRate || 0)}</span>
                </div>
                <Progress value={smsOverview?.deliveryRate || 0} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taux de clic</span>
                  <span className="font-medium">{formatPercent(smsOverview?.clickRate || 0)}</span>
                </div>
                <Progress value={smsOverview?.clickRate || 0} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taux de conversion</span>
                  <span className="font-medium">{formatPercent(smsOverview?.conversionRate || 0)}</span>
                </div>
                <Progress value={smsOverview?.conversionRate || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card data-testid="card-recent-activity">
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center py-4">
                Aucune activité récente
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  // Campaigns Management Component
  const CampaignsManager = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Gestion des campagnes</h3>
        <Button onClick={() => setNewCampaignDialog(true)} data-testid="button-create-campaign">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle campagne
        </Button>
      </div>

      {campaignsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns?.map((campaign: SmsCampaign) => (
            <Card key={campaign.id} className="p-4" data-testid={`campaign-${campaign.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-medium">{campaign.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        className={`${getStatusColor(campaign.status)} text-white`}
                        data-testid={`status-${campaign.status}`}
                      >
                        {campaign.status}
                      </Badge>
                      {campaign.audiencePersona && (
                        <Badge 
                          variant="outline" 
                          className={getPersonaColor(campaign.audiencePersona)}
                          data-testid={`persona-${campaign.audiencePersona}`}
                        >
                          {PERSONAS.find(p => p.value === campaign.audiencePersona)?.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm">
                    <div className="font-medium">
                      {campaign.sentCount} / {campaign.audienceSize} envoyés
                    </div>
                    <div className="text-muted-foreground">
                      {campaign.conversionCount} conversions
                    </div>
                  </div>
                  
                  {campaign.status === 'draft' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" data-testid={`send-${campaign.id}`}>
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer l'envoi</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir envoyer la campagne "{campaign.name}" à {campaign.audienceSize} contacts ?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => sendCampaignMutation.mutate(campaign.id)}
                            data-testid={`confirm-send-${campaign.id}`}
                          >
                            Envoyer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              
              <div className="mt-3 text-sm text-muted-foreground">
                <p className="line-clamp-2">{campaign.message}</p>
              </div>
              
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Créé le {format(new Date(campaign.createdAt), "dd MMM yyyy", { locale: fr })}
                </span>
                <span>
                  Coût estimé: {campaign.estimatedCost}€
                </span>
              </div>
            </Card>
          ))}
          
          {(!campaigns || campaigns.length === 0) && (
            <Card className="p-8">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune campagne</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre première campagne SMS pour commencer.
                </p>
                <Button onClick={() => setNewCampaignDialog(true)} data-testid="button-create-first-campaign">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une campagne
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  // Templates Library Component
  const TemplatesLibrary = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Bibliothèque de templates</h3>
        <Button onClick={() => setNewTemplateDialog(true)} data-testid="button-create-template">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau template
        </Button>
      </div>

      {templatesLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template: SmsTemplate) => (
            <Card key={template.id} className="p-4" data-testid={`template-${template.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{template.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{template.category}</Badge>
                    <Badge className={getPersonaColor(template.persona)}>
                      {PERSONAS.find(p => p.value === template.persona)?.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" data-testid={`edit-template-${template.id}`}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" data-testid={`copy-template-${template.id}`}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mb-3">
                <p className="line-clamp-3">{template.content}</p>
              </div>
              
              {template.variables && template.variables.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium mb-1">Variables:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable: string) => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{template.usageCount} utilisations</span>
                <span className="flex items-center gap-1">
                  <span className={template.isActive ? "text-green-600" : "text-red-600"}>
                    {template.isActive ? "Actif" : "Inactif"}
                  </span>
                </span>
              </div>
            </Card>
          ))}
          
          {(!templates || templates.length === 0) && (
            <div className="col-span-full">
              <Card className="p-8">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun template</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez vos premiers templates SMS pour accélérer la création de campagnes.
                  </p>
                  <Button onClick={() => setNewTemplateDialog(true)} data-testid="button-create-first-template">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un template
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Contacts Management Component
  const ContactsManager = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Gestion des contacts</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setContactImportDialog(true)} data-testid="button-import-contacts">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button variant="outline" data-testid="button-export-contacts">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-contacts"
          />
        </div>
        <Select value={filterPersona} onValueChange={setFilterPersona}>
          <SelectTrigger className="w-48" data-testid="select-filter-persona">
            <SelectValue placeholder="Tous les personas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les personas</SelectItem>
            {PERSONAS.map(persona => (
              <SelectItem key={persona.value} value={persona.value}>
                {persona.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {contactsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContacts?.map((contact: SmsContact) => (
            <Card key={contact.id} className="p-4" data-testid={`contact-${contact.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 inline mr-1" />
                        {contact.phoneNumber}
                      </span>
                      <Badge 
                        variant={contact.isOptedIn ? "default" : "destructive"}
                        data-testid={`opt-status-${contact.id}`}
                      >
                        {contact.isOptedIn ? "Opt-in" : "Opt-out"}
                      </Badge>
                      <Badge className={getPersonaColor(contact.persona)}>
                        {PERSONAS.find(p => p.value === contact.persona)?.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right text-sm">
                  <div className="font-medium">
                    {contact.totalMessagesSent} envoyés
                  </div>
                  <div className="text-muted-foreground">
                    {contact.conversionCount} conversions
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {contact.city}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {(!filteredContacts || filteredContacts.length === 0) && (
            <Card className="p-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery || filterPersona ? "Aucun contact trouvé" : "Aucun contact"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || filterPersona 
                    ? "Essayez de modifier vos critères de recherche." 
                    : "Importez vos premiers contacts pour commencer."
                  }
                </p>
                {!searchQuery && !filterPersona && (
                  <Button onClick={() => setContactImportDialog(true)} data-testid="button-import-first-contacts">
                    <Upload className="h-4 w-4 mr-2" />
                    Importer des contacts
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  // Analytics Component
  const AnalyticsDashboard = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Analytics et reporting</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-performance-by-persona">
          <CardHeader>
            <CardTitle>Performance par persona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PERSONAS.map(persona => (
                <div key={persona.value} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${persona.color}`}></div>
                    <span className="text-sm">{persona.label}</span>
                  </div>
                  <div className="text-sm font-medium">0%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="card-best-send-times">
          <CardHeader>
            <CardTitle>Meilleurs créneaux d'envoi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Données insuffisantes
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="title-sms-campaigns">Campagnes SMS</h2>
          <p className="text-muted-foreground">
            Gérez vos campagnes SMS marketing pour la nurturing des leads immobiliers
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5" data-testid="tabs-sms-navigation">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            <MessageSquare className="h-4 w-4 mr-2" />
            Campagnes
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <Sparkles className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="contacts" data-testid="tab-contacts">
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <SmsDashboard />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignsManager />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplatesLibrary />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <ContactsManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* New Campaign Dialog */}
      <Dialog open={newCampaignDialog} onOpenChange={setNewCampaignDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-new-campaign">
          <DialogHeader>
            <DialogTitle>Nouvelle campagne SMS</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign-name">Nom de la campagne</Label>
              <Input
                id="campaign-name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Relance estimation gratuite"
                data-testid="input-campaign-name"
              />
            </div>

            <div>
              <Label htmlFor="campaign-audience">Public cible</Label>
              <Select 
                value={campaignForm.audiencePersona} 
                onValueChange={(value) => setCampaignForm(prev => ({ ...prev, audiencePersona: value }))}
              >
                <SelectTrigger data-testid="select-campaign-audience">
                  <SelectValue placeholder="Sélectionner un persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les contacts</SelectItem>
                  {PERSONAS.map(persona => (
                    <SelectItem key={persona.value} value={persona.value}>
                      {persona.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="campaign-template">Template (optionnel)</Label>
              <Select 
                value={campaignForm.templateId} 
                onValueChange={(value) => {
                  setCampaignForm(prev => ({ ...prev, templateId: value }));
                  const template = templates?.find((t: SmsTemplate) => t.id === value);
                  if (template) {
                    setCampaignForm(prev => ({ ...prev, message: template.content }));
                  }
                }}
              >
                <SelectTrigger data-testid="select-campaign-template">
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template: SmsTemplate) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="campaign-message">Message SMS</Label>
              <Textarea
                id="campaign-message"
                value={campaignForm.message}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Votre message SMS..."
                rows={4}
                data-testid="textarea-campaign-message"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Variables: {'{prenom}'}, {'{ville}'}, {'{prix_estimation}'}</span>
                <span className={countSmsCharacters(campaignForm.message) > 160 ? "text-red-500" : ""}>
                  {countSmsCharacters(campaignForm.message)}/160 caractères ({getSmsCount(campaignForm.message)} SMS)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setNewCampaignDialog(false)} data-testid="button-cancel-campaign">
                Annuler
              </Button>
              <Button 
                onClick={() => createCampaignMutation.mutate({
                  ...campaignForm,
                  status: 'draft',
                  audienceSize: filteredContacts?.length || 0,
                  estimatedCost: ((filteredContacts?.length || 0) * 0.05).toFixed(2)
                })}
                disabled={!campaignForm.name || !campaignForm.message || createCampaignMutation.isPending}
                data-testid="button-save-campaign"
              >
                {createCampaignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer la campagne
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Template Dialog */}
      <Dialog open={newTemplateDialog} onOpenChange={setNewTemplateDialog}>
        <DialogContent data-testid="dialog-new-template">
          <DialogHeader>
            <DialogTitle>Nouveau template SMS</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Nom du template</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Message de bienvenue"
                data-testid="input-template-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-category">Catégorie</Label>
                <Select 
                  value={templateForm.category} 
                  onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger data-testid="select-template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="follow_up">Relance</SelectItem>
                    <SelectItem value="welcome">Bienvenue</SelectItem>
                    <SelectItem value="urgency">Urgence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template-persona">Persona cible</Label>
                <Select 
                  value={templateForm.persona} 
                  onValueChange={(value) => setTemplateForm(prev => ({ ...prev, persona: value }))}
                >
                  <SelectTrigger data-testid="select-template-persona">
                    <SelectValue placeholder="Sélectionner un persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONAS.map(persona => (
                      <SelectItem key={persona.value} value={persona.value}>
                        {persona.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="template-content">Contenu du template</Label>
              <Textarea
                id="template-content"
                value={templateForm.content}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Votre template SMS avec variables..."
                rows={4}
                data-testid="textarea-template-content"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Variables disponibles: {'{prenom}'}, {'{ville}'}, {'{prix_estimation}'}</span>
                <span className={countSmsCharacters(templateForm.content) > 160 ? "text-red-500" : ""}>
                  {countSmsCharacters(templateForm.content)}/160 caractères
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setNewTemplateDialog(false)} data-testid="button-cancel-template">
                Annuler
              </Button>
              <Button 
                onClick={() => createTemplateMutation.mutate({
                  ...templateForm,
                  variables: templateForm.content.match(/\{[^}]+\}/g) || []
                })}
                disabled={!templateForm.name || !templateForm.content || !templateForm.persona || createTemplateMutation.isPending}
                data-testid="button-save-template"
              >
                {createTemplateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer le template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Import Dialog */}
      <Dialog open={contactImportDialog} onOpenChange={setContactImportDialog}>
        <DialogContent data-testid="dialog-contact-import">
          <DialogHeader>
            <DialogTitle>Importer des contacts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Assurez-vous que tous les contacts ont donné leur consentement explicite pour recevoir des SMS marketing.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="import-file">Fichier CSV</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv"
                data-testid="input-import-file"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Format requis: firstName, lastName, phoneNumber, persona, city
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setContactImportDialog(false)} data-testid="button-cancel-import">
                Annuler
              </Button>
              <Button data-testid="button-import-contacts">
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}