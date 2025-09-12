import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Download,
  Mail,
  Target,
  Globe,
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  Star,
  MapPin,
  Send,
  AlertCircle
} from "lucide-react";
import {
  dashboardAnalyticsSchema,
  guideAnalyticsSchema,
  leadFunnelAnalyticsSchema,
  emailAnalyticsSchema,
  type DashboardAnalytics,
  type GuideAnalytics,
  type LeadFunnelAnalytics,
  type EmailAnalytics
} from "@shared/schema";
import {
  AnalyticsKPISkeleton,
  AnalyticsChartSkeleton,
  AnalyticsTableSkeleton,
  AnalyticsFiltersSkeleton,
  AnalyticsErrorState,
  AnalyticsEmptyState
} from "./AnalyticsSkeleton";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const PERSONA_LABELS = {
  presse: 'Pressé',
  maximisateur: 'Maximisateur', 
  succession: 'Succession',
  nouvelle_vie: 'Nouvelle vie',
  investisseur: 'Investisseur',
  primo: 'Primo-vendeur'
};

const LEAD_TYPE_LABELS = {
  estimation_quick: 'Estimation rapide',
  estimation_detailed: 'Estimation détaillée',
  financing: 'Financement',
  guide_download: 'Téléchargement guide',
  contact: 'Contact direct'
};

// Utility function to create validated queries
function createValidatedQuery<T>(
  schema: any,
  endpoint: string,
  params: URLSearchParams
) {
  return useQuery({
    queryKey: [endpoint, ...Array.from(params.entries()).flat()],
    queryFn: async () => {
      const url = `${endpoint}?${params.toString()}`;
      const response = await fetch(url, { credentials: "include" });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate response with Zod schema
      try {
        return schema.parse(data) as T;
      } catch (error) {
        console.error('Schema validation failed:', error);
        throw new Error('Données reçues invalides');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}

export default function AdminAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("7d");
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Create URL params for queries
  const createParams = (additionalParams: Record<string, string> = {}) => {
    const params = new URLSearchParams({ period, _r: refreshKey.toString() });
    if (selectedPersona) params.append('persona', selectedPersona);
    if (selectedSource) params.append('source', selectedSource);
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return params;
  };

  // Validated queries using repository pattern
  const dashboardQuery = createValidatedQuery<DashboardAnalytics>(
    dashboardAnalyticsSchema,
    '/api/analytics/dashboard',
    createParams()
  );

  const guidesQuery = createValidatedQuery<GuideAnalytics>(
    guideAnalyticsSchema,
    '/api/analytics/guides',
    createParams()
  );

  const funnelQuery = createValidatedQuery<LeadFunnelAnalytics>(
    leadFunnelAnalyticsSchema,
    '/api/analytics/leads/funnel',
    createParams()
  );

  const emailQuery = createValidatedQuery<EmailAnalytics>(
    emailAnalyticsSchema,
    '/api/analytics/email',
    createParams()
  );

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(num);
  };

  // Safe data access with validation
  const isDashboardLoading = dashboardQuery.isLoading;
  const isDashboardError = dashboardQuery.isError;
  const dashboardData = dashboardQuery.data;
  const dashboardError = dashboardQuery.error?.message;

  // Loading state for filters area
  if (isDashboardLoading && !dashboardData) {
    return (
      <div className="space-y-6" data-testid="analytics-loading">
        <AnalyticsFiltersSkeleton />
        <AnalyticsKPISkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsChartSkeleton />
          <AnalyticsChartSkeleton />
        </div>
      </div>
    );
  }

  // Error state for dashboard
  if (isDashboardError && !dashboardData) {
    return (
      <div className="space-y-6" data-testid="analytics-error">
        <AnalyticsErrorState 
          error={dashboardError || "Erreur de chargement des données"}
          onRetry={handleRefresh}
          title="Impossible de charger le dashboard"
        />
      </div>
    );
  }

  // Overview Dashboard Component with safe data guards
  const OverviewDashboard = ({ data }: { data: DashboardAnalytics }) => {
    if (!data?.kpis || !data?.charts) {
      return <AnalyticsEmptyState message="Données du dashboard incomplètes" />;
    }

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card data-testid="kpi-total-leads">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.kpis.totalLeads)}</div>
              <p className="text-xs text-muted-foreground">
                {data.trends?.leadsGrowth && data.trends.leadsGrowth > 0 ? (
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{formatPercentage(data.trends.leadsGrowth)}
                  </span>
                ) : data.trends?.leadsGrowth ? (
                  <span className="text-red-600 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {formatPercentage(data.trends.leadsGrowth)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="kpi-qualified-leads">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Qualifiés</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.kpis.qualifiedLeads)}</div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(data.kpis.conversionRate)} de conversion
              </p>
            </CardContent>
          </Card>

          <Card data-testid="kpi-conversion-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux Conversion</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(data.kpis.conversionRate)}</div>
              <p className="text-xs text-muted-foreground">
                {data.trends?.conversionGrowth && data.trends.conversionGrowth > 0 ? (
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{formatPercentage(data.trends.conversionGrowth)}
                  </span>
                ) : data.trends?.conversionGrowth ? (
                  <span className="text-red-600 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {formatPercentage(data.trends.conversionGrowth)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="kpi-guides-downloaded">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guides Téléchargés</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.kpis.totalGuidesDownloaded)}</div>
              <p className="text-xs text-muted-foreground">
                {period === '1d' ? 'Aujourd\'hui' : 
                 period === '7d' ? 'Cette semaine' : 
                 period === '30d' ? 'Ce mois' : 'Cette période'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="kpi-avg-conversion-time">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temps Conversion</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.kpis.avgTimeToConversion}j</div>
              <p className="text-xs text-muted-foreground">
                Durée moyenne
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Leads Chart */}
          <Card data-testid="chart-daily-leads">
            <CardHeader>
              <CardTitle>Évolution des Leads</CardTitle>
              <CardDescription>Leads par jour et par type</CardDescription>
            </CardHeader>
            <CardContent>
              {data.charts.dailyLeads && data.charts.dailyLeads.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.charts.dailyLeads}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      stackId="1"
                      stroke="#0088FE"
                      fill="#0088FE"
                      name="Total Leads"
                    />
                    <Area
                      type="monotone"
                      dataKey="qualified"
                      stackId="1"
                      stroke="#00C49F"
                      fill="#00C49F"
                      name="Leads Qualifiés"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <AnalyticsEmptyState message="Aucune donnée de leads" />
              )}
            </CardContent>
          </Card>

          {/* Lead Sources Chart */}
          <Card data-testid="chart-lead-sources">
            <CardHeader>
              <CardTitle>Sources des Leads</CardTitle>
              <CardDescription>Répartition par source de trafic</CardDescription>
            </CardHeader>
            <CardContent>
              {data.charts.leadSources && data.charts.leadSources.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.charts.leadSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.charts.leadSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <AnalyticsEmptyState message="Aucune donnée de sources" />
              )}
            </CardContent>
          </Card>

          {/* Lead Types Chart */}
          <Card data-testid="chart-lead-types">
            <CardHeader>
              <CardTitle>Types de Leads</CardTitle>
              <CardDescription>Répartition par type d'interaction</CardDescription>
            </CardHeader>
            <CardContent>
              {data.charts.leadTypes && data.charts.leadTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.charts.leadTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="type" 
                      tickFormatter={(value) => LEAD_TYPE_LABELS[value as keyof typeof LEAD_TYPE_LABELS] || value}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => LEAD_TYPE_LABELS[value as keyof typeof LEAD_TYPE_LABELS] || value}
                    />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <AnalyticsEmptyState message="Aucune donnée de types" />
              )}
            </CardContent>
          </Card>

          {/* Top Cities Chart */}
          <Card data-testid="chart-top-cities">
            <CardHeader>
              <CardTitle>Top Villes</CardTitle>
              <CardDescription>Leads par localisation</CardDescription>
            </CardHeader>
            <CardContent>
              {data.charts.topCities && data.charts.topCities.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.charts.topCities}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <AnalyticsEmptyState message="Aucune donnée de villes" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Guides Dashboard Component with safe data guards
  const GuidesDashboard = ({ data }: { data: GuideAnalytics }) => {
    if (!data?.summary || !data?.guides) {
      return <AnalyticsEmptyState message="Données des guides incomplètes" />;
    }

    return (
      <div className="space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card data-testid="guides-total">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guides</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.summary.totalGuides)}</div>
            </CardContent>
          </Card>

          <Card data-testid="guides-page-views">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vues Totales</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.summary.totalPageViews)}</div>
            </CardContent>
          </Card>

          <Card data-testid="guides-downloads">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Téléchargements</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.summary.totalDownloads)}</div>
            </CardContent>
          </Card>

          <Card data-testid="guides-conversion-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux Conversion</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(data.summary.avgConversionRate)}</div>
            </CardContent>
          </Card>

          <Card data-testid="guides-engagement">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(data.summary.avgEngagementScore)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Guides Performance Table */}
        <Card data-testid="guides-performance-table">
          <CardHeader>
            <CardTitle>Performance des Guides</CardTitle>
            <CardDescription>Métriques détaillées par guide</CardDescription>
          </CardHeader>
          <CardContent>
            {data.guides.length > 0 ? (
              <div className="space-y-4">
                {data.guides.slice(0, 10).map((guide) => (
                  <div key={guide.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{guide.title}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Persona: {PERSONA_LABELS[guide.persona as keyof typeof PERSONA_LABELS] || guide.persona}</span>
                        <span>Vues: {formatNumber(guide.metrics.pageViews)}</span>
                        <span>Téléchargements: {formatNumber(guide.metrics.downloads)}</span>
                        <span>Leads: {formatNumber(guide.metrics.leads)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatPercentage(guide.metrics.conversionRate)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Score: {guide.performance.engagementScore}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnalyticsEmptyState message="Aucun guide trouvé" />
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Lead Funnel Dashboard Component with safe data guards
  const LeadFunnelDashboard = ({ data }: { data: LeadFunnelAnalytics }) => {
    if (!data?.funnel || !data?.conversionRates) {
      return <AnalyticsEmptyState message="Données du funnel incomplètes" />;
    }

    return (
      <div className="space-y-6">
        {/* Funnel Visualization */}
        <Card data-testid="funnel-chart">
          <CardHeader>
            <CardTitle>Entonnoir de Conversion</CardTitle>
            <CardDescription>Progression des visiteurs vers les leads</CardDescription>
          </CardHeader>
          <CardContent>
            {data.funnel.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <FunnelChart>
                  <Funnel
                    dataKey="count"
                    data={data.funnel}
                    isAnimationActive
                    labelLine={false}
                    label={({ name, value }: any) => `${name}: ${formatNumber(value)}`}
                  >
                    <LabelList position="center" fill="#fff" />
                  </Funnel>
                  <Tooltip />
                </FunnelChart>
              </ResponsiveContainer>
            ) : (
              <AnalyticsEmptyState message="Aucune donnée de funnel" />
            )}
          </CardContent>
        </Card>

        {/* Conversion Rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card data-testid="funnel-visitor-to-sms">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visiteur → SMS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(data.conversionRates.visitorToSms)}</div>
            </CardContent>
          </Card>

          <Card data-testid="funnel-sms-to-form">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SMS → Formulaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(data.conversionRates.smsToForm)}</div>
            </CardContent>
          </Card>

          <Card data-testid="funnel-form-to-qualified">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Form → Qualifié</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(data.conversionRates.formToQualified)}</div>
            </CardContent>
          </Card>

          <Card data-testid="funnel-qualified-to-converted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualifié → Converti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(data.conversionRates.qualifiedToConverted)}</div>
            </CardContent>
          </Card>

          <Card data-testid="funnel-overall-conversion">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Globale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(data.conversionRates.overallConversion)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Scoring Distribution */}
        <Card data-testid="lead-scoring-chart">
          <CardHeader>
            <CardTitle>Distribution des Scores</CardTitle>
            <CardDescription>Répartition qualité des leads (Score moyen: {Math.round(data.leadScoring.avgScore)})</CardDescription>
          </CardHeader>
          <CardContent>
            {data.leadScoring.distribution && data.leadScoring.distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.leadScoring.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <AnalyticsEmptyState message="Aucune donnée de scoring" />
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Email Dashboard Component with safe data guards
  const EmailDashboard = ({ data }: { data: EmailAnalytics }) => {
    if (!data?.overview || !data?.templatePerformance) {
      return <AnalyticsEmptyState message="Données email incomplètes" />;
    }

    return (
      <div className="space-y-6">
        {/* Email Overview KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="email-total-sent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Envoyés</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.overview.totalSent)}</div>
              <p className="text-xs text-muted-foreground">
                Taux succès: {formatPercentage(data.overview.successRate)}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="email-open-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux d'Ouverture</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(data.overview.avgOpenRate)}</div>
            </CardContent>
          </Card>

          <Card data-testid="email-click-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Clic</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(data.overview.avgClickRate)}</div>
            </CardContent>
          </Card>

          <Card data-testid="email-revenue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus Estimés</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.overview.estimatedRevenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Template Performance */}
        <Card data-testid="email-template-performance">
          <CardHeader>
            <CardTitle>Performance des Templates</CardTitle>
            <CardDescription>Métriques détaillées par template email</CardDescription>
          </CardHeader>
          <CardContent>
            {data.templatePerformance.length > 0 ? (
              <div className="space-y-4">
                {data.templatePerformance.slice(0, 10).map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Catégorie: {template.category}</span>
                        <span>Envoyés: {formatNumber(template.sent)}</span>
                        <span>Échecs: {formatNumber(template.failed)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Open: {formatPercentage(template.openRate)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Click: {formatPercentage(template.clickRate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnalyticsEmptyState message="Aucun template trouvé" />
            )}
          </CardContent>
        </Card>

        {/* Daily Email Trends */}
        <Card data-testid="email-daily-trends">
          <CardHeader>
            <CardTitle>Tendances Quotidiennes</CardTitle>
            <CardDescription>Volume d'emails par jour</CardDescription>
          </CardHeader>
          <CardContent>
            {data.trends?.dailyEmails && data.trends.dailyEmails.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trends.dailyEmails}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke="#00C49F" name="Envoyés" />
                  <Line type="monotone" dataKey="failed" stroke="#FF8042" name="Échecs" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <AnalyticsEmptyState message="Aucune donnée de tendances" />
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={period} onValueChange={setPeriod} data-testid="select-period">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPersona} onValueChange={setSelectedPersona} data-testid="select-persona">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tous les personas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les personas</SelectItem>
              {Object.entries(PERSONA_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSource} onValueChange={setSelectedSource} data-testid="select-source">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Toutes les sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les sources</SelectItem>
              <SelectItem value="estimation-immobilier-gironde.fr">Site principal</SelectItem>
              <SelectItem value="direct">Accès direct</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isDashboardLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isDashboardLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Badge variant="outline" data-testid="status-badge">
            {isDashboardLoading ? 'Actualisation...' : 'À jour'}
          </Badge>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4" data-testid="analytics-tabs">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="guides" data-testid="tab-guides">
            <Star className="w-4 h-4 mr-2" />
            Guides
          </TabsTrigger>
          <TabsTrigger value="funnel" data-testid="tab-funnel">
            <Target className="w-4 h-4 mr-2" />
            Entonnoir
          </TabsTrigger>
          <TabsTrigger value="email" data-testid="tab-email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" data-testid="content-overview">
          {isDashboardLoading ? (
            <div className="space-y-6">
              <AnalyticsKPISkeleton />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalyticsChartSkeleton />
                <AnalyticsChartSkeleton />
              </div>
            </div>
          ) : isDashboardError ? (
            <AnalyticsErrorState 
              error={dashboardError || "Erreur de chargement"}
              onRetry={handleRefresh}
            />
          ) : dashboardData ? (
            <OverviewDashboard data={dashboardData} />
          ) : (
            <AnalyticsEmptyState message="Aucune donnée disponible" />
          )}
        </TabsContent>

        <TabsContent value="guides" data-testid="content-guides">
          {guidesQuery.isLoading ? (
            <div className="space-y-6">
              <AnalyticsKPISkeleton />
              <AnalyticsTableSkeleton />
            </div>
          ) : guidesQuery.isError ? (
            <AnalyticsErrorState 
              error={guidesQuery.error?.message || "Erreur de chargement des guides"}
              onRetry={handleRefresh}
            />
          ) : guidesQuery.data ? (
            <GuidesDashboard data={guidesQuery.data} />
          ) : (
            <AnalyticsEmptyState message="Aucune donnée de guides disponible" />
          )}
        </TabsContent>

        <TabsContent value="funnel" data-testid="content-funnel">
          {funnelQuery.isLoading ? (
            <div className="space-y-6">
              <AnalyticsChartSkeleton />
              <AnalyticsKPISkeleton />
            </div>
          ) : funnelQuery.isError ? (
            <AnalyticsErrorState 
              error={funnelQuery.error?.message || "Erreur de chargement du funnel"}
              onRetry={handleRefresh}
            />
          ) : funnelQuery.data ? (
            <LeadFunnelDashboard data={funnelQuery.data} />
          ) : (
            <AnalyticsEmptyState message="Aucune donnée de funnel disponible" />
          )}
        </TabsContent>

        <TabsContent value="email" data-testid="content-email">
          {emailQuery.isLoading ? (
            <div className="space-y-6">
              <AnalyticsKPISkeleton />
              <AnalyticsTableSkeleton />
              <AnalyticsChartSkeleton />
            </div>
          ) : emailQuery.isError ? (
            <AnalyticsErrorState 
              error={emailQuery.error?.message || "Erreur de chargement des emails"}
              onRetry={handleRefresh}
            />
          ) : emailQuery.data ? (
            <EmailDashboard data={emailQuery.data} />
          ) : (
            <AnalyticsEmptyState message="Aucune donnée d'email disponible" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}