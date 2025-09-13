import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, TrendingUp, Users, Target, Settings, History, Plus, Minus, Info, Award, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

// Types for lead scoring data
interface LeadScoring {
  id: string;
  leadId: string;
  totalScore: number;
  budgetScore: number;
  authorityScore: number;
  needScore: number;
  timelineScore: number;
  qualificationStatus: "unqualified" | "to_review" | "qualified" | "hot_lead";
  confidenceLevel: number;
  manualAdjustment?: number;
  notes?: string;
  assignedTo?: string;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    city: string;
    estimatedValue?: number;
    projectType?: string;
    timeline?: string;
  };
}

interface ScoringAnalytics {
  overview: {
    totalLeads: number;
    averageScore: number;
    qualifiedLeads: number;
    qualificationRate: number;
    hotLeads: number;
    conversionRate: number;
  };
  scoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  bantBreakdown: {
    budget: { average: number; distribution: Record<string, number> };
    authority: { average: number; distribution: Record<string, number> };
    need: { average: number; distribution: Record<string, number> };
    timeline: { average: number; distribution: Record<string, number> };
  };
  recommendations: Array<{
    type: string;
    description: string;
    impact: string;
  }>;
}

interface ScoringConfig {
  id: string;
  criteriaType: string;
  weight: number;
  description: string;
  isActive: boolean;
  rules: string;
  thresholds: string;
  bonusRules: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const getQualificationColor = (status: string) => {
  switch (status) {
    case "hot_lead": return "bg-red-500";
    case "qualified": return "bg-green-500";
    case "to_review": return "bg-yellow-500";
    default: return "bg-gray-500";
  }
};

const getQualificationIcon = (status: string) => {
  switch (status) {
    case "hot_lead": return <Award className="h-4 w-4" />;
    case "qualified": return <CheckCircle className="h-4 w-4" />;
    case "to_review": return <AlertTriangle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const getQualificationLabel = (status: string) => {
  switch (status) {
    case "hot_lead": return "Lead chaud";
    case "qualified": return "Qualifié";
    case "to_review": return "À revoir";
    case "unqualified": return "Non qualifié";
    default: return status;
  }
};

export default function LeadScoringDashboard() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadScoring | null>(null);
  const [adjustment, setAdjustment] = useState(0);
  const [adjustmentNotes, setAdjustmentNotes] = useState("");

  // Fetch scoring analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/admin/scoring/analytics", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/scoring/analytics?period=${selectedPeriod}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Fetch lead scoring data
  const { data: leadScoring, isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ["/api/admin/scoring/leads", selectedStatus],
    queryFn: async () => {
      const statusParam = selectedStatus === "all" ? "" : `&status=${selectedStatus}`;
      const response = await fetch(`/api/admin/scoring/leads?limit=100${statusParam}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch lead scoring');
      return response.json();
    }
  });

  // Fetch scoring configuration
  const { data: scoringConfig, isLoading: configLoading } = useQuery({
    queryKey: ["/api/admin/scoring/config"],
    queryFn: async () => {
      const response = await fetch("/api/admin/scoring/config", {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch config');
      return response.json();
    }
  });

  // Initialize scoring system
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/scoring/initialize", {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to initialize');
      return response.json();
    },
    onSuccess: () => {
      toast({ description: "Système de scoring initialisé avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scoring"] });
    }
  });

  // Recalculate all scores
  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/scoring/recalculate-all", {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to recalculate');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        description: `${data.updated} scores recalculés avec succès` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scoring"] });
    }
  });

  // Adjust lead score
  const adjustScoreMutation = useMutation({
    mutationFn: async ({ leadId, adjustment, notes }: { leadId: string; adjustment: number; notes: string }) => {
      const response = await fetch(`/api/admin/scoring/leads/${leadId}/adjust`, {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adjustment, notes })
      });
      if (!response.ok) throw new Error('Failed to adjust score');
      return response.json();
    },
    onSuccess: () => {
      toast({ description: "Score ajusté avec succès" });
      setAdjustmentDialogOpen(false);
      setSelectedLead(null);
      setAdjustment(0);
      setAdjustmentNotes("");
      refetchLeads();
    }
  });

  // Recalculate single lead score
  const recalculateLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await fetch(`/api/admin/scoring/leads/${leadId}/calculate`, {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: "manual_recalculation" })
      });
      if (!response.ok) throw new Error('Failed to recalculate');
      return response.json();
    },
    onSuccess: () => {
      toast({ description: "Score recalculé avec succès" });
      refetchLeads();
    }
  });

  const handleAdjustScore = () => {
    if (!selectedLead || adjustment === 0) return;
    
    adjustScoreMutation.mutate({
      leadId: selectedLead.leadId,
      adjustment,
      notes: adjustmentNotes
    });
  };

  if (analyticsLoading || leadsLoading || configLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="lead-scoring-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-dashboard-title">Scoring des leads - Méthodologie BANT</h2>
          <p className="text-muted-foreground">Système de qualification automatique des leads immobiliers</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod} data-testid="select-period">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
            variant="outline"
            size="sm"
            data-testid="button-recalculate-all"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
            Recalculer tout
          </Button>
          <Button
            onClick={() => initializeMutation.mutate()}
            disabled={initializeMutation.isPending}
            variant="outline"
            size="sm"
            data-testid="button-initialize"
          >
            <Settings className="h-4 w-4 mr-2" />
            Initialiser
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-total-leads">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-leads">{analytics.overview.totalLeads}</div>
              <p className="text-xs text-muted-foreground">Leads analysés</p>
            </CardContent>
          </Card>

          <Card data-testid="card-average-score">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-average-score">
                {Math.round(analytics.overview.averageScore)}/100
              </div>
              <Progress value={analytics.overview.averageScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card data-testid="card-qualified-leads">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads qualifiés</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-qualified-leads">{analytics.overview.qualifiedLeads}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round(analytics.overview.qualificationRate)}% du total
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-hot-leads">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads chauds</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="text-hot-leads">{analytics.overview.hotLeads}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round(analytics.overview.conversionRate)}% conversion
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {analytics?.recommendations && analytics.recommendations.length > 0 && (
        <div className="space-y-2">
          {analytics.recommendations.map((rec: ScoringAnalytics['recommendations'][0], index: number) => (
            <Alert key={index} data-testid={`alert-recommendation-${index}`}>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{rec.description}</strong> - {rec.impact}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="leads" data-testid="tab-leads">Gestion des leads</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics BANT</TabsTrigger>
          <TabsTrigger value="config" data-testid="tab-config">Configuration</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            {analytics && (
              <Card data-testid="card-score-distribution">
                <CardHeader>
                  <CardTitle>Distribution des scores</CardTitle>
                  <CardDescription>Répartition des leads par tranche de score</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* BANT Breakdown */}
            {analytics && (
              <Card data-testid="card-bant-breakdown">
                <CardHeader>
                  <CardTitle>Analyse BANT</CardTitle>
                  <CardDescription>Scores moyens par critère</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Budget</span>
                        <span className="text-sm">{Math.round(analytics.bantBreakdown.budget.average)}/25</span>
                      </div>
                      <Progress value={(analytics.bantBreakdown.budget.average / 25) * 100} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Authority</span>
                        <span className="text-sm">{Math.round(analytics.bantBreakdown.authority.average)}/25</span>
                      </div>
                      <Progress value={(analytics.bantBreakdown.authority.average / 25) * 100} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Need</span>
                        <span className="text-sm">{Math.round(analytics.bantBreakdown.need.average)}/25</span>
                      </div>
                      <Progress value={(analytics.bantBreakdown.need.average / 25) * 100} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Timeline</span>
                        <span className="text-sm">{Math.round(analytics.bantBreakdown.timeline.average)}/25</span>
                      </div>
                      <Progress value={(analytics.bantBreakdown.timeline.average / 25) * 100} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Leads Management Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedStatus} onValueChange={setSelectedStatus} data-testid="select-status-filter">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="hot_lead">Leads chauds</SelectItem>
                <SelectItem value="qualified">Qualifiés</SelectItem>
                <SelectItem value="to_review">À revoir</SelectItem>
                <SelectItem value="unqualified">Non qualifiés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card data-testid="card-leads-table">
            <CardHeader>
              <CardTitle>Gestion des leads</CardTitle>
              <CardDescription>Scores actuels et actions possibles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Score total</TableHead>
                    <TableHead>BANT</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Confiance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadScoring?.map((scoring: LeadScoring) => (
                    <TableRow key={scoring.id} data-testid={`row-lead-${scoring.leadId}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {scoring.lead?.firstName} {scoring.lead?.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {scoring.lead?.email} • {scoring.lead?.city}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-lg font-bold" data-testid={`text-score-${scoring.leadId}`}>
                            {scoring.totalScore}/100
                          </div>
                          <Progress value={scoring.totalScore} className="w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div>B: {scoring.budgetScore}/25</div>
                          <div>A: {scoring.authorityScore}/25</div>
                          <div>N: {scoring.needScore}/25</div>
                          <div>T: {scoring.timelineScore}/25</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`text-white ${getQualificationColor(scoring.qualificationStatus)}`}
                          data-testid={`badge-status-${scoring.leadId}`}
                        >
                          {getQualificationIcon(scoring.qualificationStatus)}
                          <span className="ml-1">{getQualificationLabel(scoring.qualificationStatus)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm" data-testid={`text-confidence-${scoring.leadId}`}>
                          {scoring.confidenceLevel}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => recalculateLeadMutation.mutate(scoring.leadId)}
                            disabled={recalculateLeadMutation.isPending}
                            data-testid={`button-recalculate-${scoring.leadId}`}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedLead(scoring);
                              setAdjustmentDialogOpen(true);
                            }}
                            data-testid={`button-adjust-${scoring.leadId}`}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-qualification-distribution">
                <CardHeader>
                  <CardTitle>Distribution par qualification</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.scoreDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                        label={({ range, percentage }) => `${range}: ${Math.round(percentage)}%`}
                      >
                        {analytics.scoreDistribution.map((entry: ScoringAnalytics['scoreDistribution'][0], index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card data-testid="card-bant-details">
                <CardHeader>
                  <CardTitle>Détails BANT</CardTitle>
                  <CardDescription>Analyse détaillée des critères de qualification</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Budget (Capacité financière)</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Évaluation basée sur la valeur estimée du bien et les informations fournies
                      </p>
                      <div className="text-lg">Moyenne: {Math.round(analytics.bantBreakdown.budget.average)}/25</div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Authority (Pouvoir décisionnel)</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Niveau d'autorité dans la décision de vente (propriétaire, mandataire, etc.)
                      </p>
                      <div className="text-lg">Moyenne: {Math.round(analytics.bantBreakdown.authority.average)}/25</div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Need (Urgence de vente)</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Motivation et urgence de la vente selon le type de projet
                      </p>
                      <div className="text-lg">Moyenne: {Math.round(analytics.bantBreakdown.need.average)}/25</div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Timeline (Délai souhaité)</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Échéance de vente souhaitée par le propriétaire
                      </p>
                      <div className="text-lg">Moyenne: {Math.round(analytics.bantBreakdown.timeline.average)}/25</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card data-testid="card-scoring-configuration">
            <CardHeader>
              <CardTitle>Configuration du scoring BANT</CardTitle>
              <CardDescription>Paramétrage des critères et pondérations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {scoringConfig?.map((config: ScoringConfig) => (
                  <div key={config.id} className="border rounded-lg p-4" data-testid={`config-${config.criteriaType}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">{config.criteriaType}</h4>
                      <Badge variant={config.isActive ? "default" : "secondary"}>
                        {config.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{config.description}</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <Label className="text-xs">Poids</Label>
                        <div className="text-lg font-bold">{config.weight}/25</div>
                      </div>
                      <div className="flex-1">
                        <Progress value={(config.weight / 25) * 100} />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    La configuration avancée des critères BANT nécessite des compétences techniques.
                    Contactez l'équipe de développement pour modifier les règles de scoring.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Score Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent data-testid="dialog-score-adjustment">
          <DialogHeader>
            <DialogTitle>Ajuster le score du lead</DialogTitle>
            <DialogDescription>
              {selectedLead && `${selectedLead.lead?.firstName} ${selectedLead.lead?.lastName} - Score actuel: ${selectedLead.totalScore}/100`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="adjustment">Ajustement du score (-50 à +50)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustment(Math.max(-50, adjustment - 5))}
                  data-testid="button-decrease-adjustment"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="adjustment"
                  type="number"
                  value={adjustment}
                  onChange={(e) => setAdjustment(Math.min(50, Math.max(-50, parseInt(e.target.value) || 0)))}
                  className="text-center"
                  min="-50"
                  max="50"
                  data-testid="input-adjustment"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustment(Math.min(50, adjustment + 5))}
                  data-testid="button-increase-adjustment"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {selectedLead && (
                <p className="text-sm text-muted-foreground mt-1">
                  Nouveau score: {Math.max(0, Math.min(100, selectedLead.totalScore + adjustment))}/100
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="notes">Notes de justification</Label>
              <Textarea
                id="notes"
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="Expliquez la raison de cet ajustement..."
                className="mt-1"
                data-testid="textarea-adjustment-notes"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdjustmentDialogOpen(false)} data-testid="button-cancel-adjustment">
                Annuler
              </Button>
              <Button
                onClick={handleAdjustScore}
                disabled={adjustment === 0 || adjustScoreMutation.isPending}
                data-testid="button-confirm-adjustment"
              >
                {adjustScoreMutation.isPending ? "Application..." : "Appliquer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}