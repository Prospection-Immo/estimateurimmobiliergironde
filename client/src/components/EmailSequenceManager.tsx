import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  Settings,
  BarChart3,
  Filter
} from 'lucide-react';

interface EmailSequence {
  id: string;
  guideId: string;
  leadEmail: string;
  persona: string;
  sequenceStep: number;
  emailType: string;
  scheduledFor: string;
  sentAt?: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  createdAt: string;
}

interface SequenceStats {
  totalSequences: number;
  scheduled: number;
  sent: number;
  failed: number;
  cancelled: number;
  byPersona: Record<string, number>;
}

const PERSONA_LABELS = {
  presse: 'Pressé',
  maximisateur: 'Maximisateur',
  succession: 'Succession',
  nouvelle_vie: 'Nouvelle vie',
  investisseur: 'Investisseur',
  primo: 'Primo-vendeur'
};

const EMAIL_TYPE_LABELS = {
  guide_delivery: 'Livraison guide',
  tip: 'Conseil pratique',
  case_study: 'Cas d\'étude',
  soft_offer: 'Offre douce'
};

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const STATUS_ICONS = {
  scheduled: Clock,
  sent: CheckCircle,
  failed: XCircle,
  cancelled: Pause
};

export default function EmailSequenceManager() {
  const [filters, setFilters] = useState({
    persona: 'all',
    status: 'all',
    search: ''
  });
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sequence statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/email-sequences/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch sequences with filters
  const { data: sequencesData, isLoading: sequencesLoading, refetch: refetchSequences } = useQuery({
    queryKey: ['/api/admin/email-sequences', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.persona !== 'all') params.append('persona', filters.persona);
      if (filters.status !== 'all') params.append('status', filters.status);
      
      const response = await fetch(`/api/admin/email-sequences?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sequences');
      return response.json();
    },
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Process scheduled emails mutation
  const processEmailsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/email-sequences/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to process emails');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Emails traités avec succès',
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-sequences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-sequences/stats'] });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de traiter les emails',
        variant: 'destructive'
      });
    }
  });

  // Update sequence status mutation
  const updateSequenceMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/admin/email-sequences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update sequence');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Séquence mise à jour',
        description: 'Le statut a été modifié avec succès'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-sequences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-sequences/stats'] });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la séquence',
        variant: 'destructive'
      });
    }
  });

  // Setup templates mutation
  const setupTemplatesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/email-sequences/setup-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to setup templates');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Templates initialisés',
        description: `${data.created} templates créés avec succès`
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'initialiser les templates',
        variant: 'destructive'
      });
    }
  });

  const handleUpdateSequence = (id: string, status: string) => {
    updateSequenceMutation.mutate({ id, status });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  interface StatCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    color?: string;
  }

  const StatCard = ({ title, value, icon: Icon, color = "text-blue-600" }: StatCardProps) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  const SequenceRow = ({ sequence }: { sequence: EmailSequence }) => {
    const StatusIcon = STATUS_ICONS[sequence.status];
    const isScheduled = sequence.status === 'scheduled';
    const canCancel = sequence.status === 'scheduled';

    return (
      <TableRow>
        <TableCell className="font-medium">
          {sequence.leadEmail}
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            {PERSONA_LABELS[sequence.persona as keyof typeof PERSONA_LABELS] || sequence.persona}
          </Badge>
        </TableCell>
        <TableCell>
          {EMAIL_TYPE_LABELS[sequence.emailType as keyof typeof EMAIL_TYPE_LABELS] || sequence.emailType}
        </TableCell>
        <TableCell>
          J+{sequence.sequenceStep}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <Badge className={STATUS_COLORS[sequence.status]}>
              {sequence.status}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          {sequence.scheduledFor && formatDate(sequence.scheduledFor)}
        </TableCell>
        <TableCell>
          {sequence.sentAt && formatDate(sequence.sentAt)}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" data-testid={`button-view-${sequence.id}`}>
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Détails de la séquence</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-sm text-gray-600">{sequence.leadEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Persona</label>
                      <p className="text-sm text-gray-600">
                        {PERSONA_LABELS[sequence.persona as keyof typeof PERSONA_LABELS]}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Type d'email</label>
                      <p className="text-sm text-gray-600">
                        {EMAIL_TYPE_LABELS[sequence.emailType as keyof typeof EMAIL_TYPE_LABELS]}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Étape</label>
                      <p className="text-sm text-gray-600">Jour +{sequence.sequenceStep}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Statut</label>
                      <Badge className={STATUS_COLORS[sequence.status]}>
                        {sequence.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Créé le</label>
                      <p className="text-sm text-gray-600">{formatDate(sequence.createdAt)}</p>
                    </div>
                  </div>
                  {sequence.scheduledFor && (
                    <div>
                      <label className="text-sm font-medium">Programmé pour</label>
                      <p className="text-sm text-gray-600">{formatDate(sequence.scheduledFor)}</p>
                    </div>
                  )}
                  {sequence.sentAt && (
                    <div>
                      <label className="text-sm font-medium">Envoyé le</label>
                      <p className="text-sm text-gray-600">{formatDate(sequence.sentAt)}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateSequence(sequence.id, 'cancelled')}
                data-testid={`button-cancel-${sequence.id}`}
              >
                <XCircle className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6" data-testid="email-sequence-manager">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Séquences Email</h2>
          <p className="text-gray-600">Gestion des emails automatisés par persona</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => processEmailsMutation.mutate()}
            disabled={processEmailsMutation.isPending}
            data-testid="button-process-emails"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${processEmailsMutation.isPending ? 'animate-spin' : ''}`} />
            Traiter les emails
          </Button>
          <Button
            variant="outline"
            onClick={() => setupTemplatesMutation.mutate()}
            disabled={setupTemplatesMutation.isPending}
            data-testid="button-setup-templates"
          >
            <Settings className="h-4 w-4 mr-2" />
            Setup Templates
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sequences" data-testid="tab-sequences">Séquences</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytiques</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistics Cards */}
          {statsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (stats as SequenceStats) ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total séquences"
                value={(stats as SequenceStats).totalSequences}
                icon={Mail}
                color="text-blue-600"
              />
              <StatCard
                title="Programmées"
                value={(stats as SequenceStats).scheduled}
                icon={Clock}
                color="text-yellow-600"
              />
              <StatCard
                title="Envoyées"
                value={(stats as SequenceStats).sent}
                icon={CheckCircle}
                color="text-green-600"
              />
              <StatCard
                title="Échecs"
                value={(stats as SequenceStats).failed}
                icon={XCircle}
                color="text-red-600"
              />
            </div>
          ) : null}

          {/* Personas Distribution */}
          {(stats as SequenceStats) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Répartition par Persona
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                  {Object.entries((stats as SequenceStats).byPersona).map(([persona, count]) => (
                    <div key={persona} className="text-center">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-gray-600">
                        {PERSONA_LABELS[persona as keyof typeof PERSONA_LABELS] || persona}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sequences" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-48">
                  <label className="text-sm font-medium mb-1 block">Persona</label>
                  <Select value={filters.persona} onValueChange={(value) => setFilters(prev => ({ ...prev, persona: value }))}>
                    <SelectTrigger data-testid="select-persona-filter">
                      <SelectValue placeholder="Toutes les personas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les personas</SelectItem>
                      {Object.entries(PERSONA_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-48">
                  <label className="text-sm font-medium mb-1 block">Statut</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="scheduled">Programmé</SelectItem>
                      <SelectItem value="sent">Envoyé</SelectItem>
                      <SelectItem value="failed">Échec</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-48">
                  <label className="text-sm font-medium mb-1 block">Recherche</label>
                  <Input
                    placeholder="Email ou guide..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    data-testid="input-search"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sequences Table */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des séquences</CardTitle>
            </CardHeader>
            <CardContent>
              {sequencesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : sequencesData?.sequences?.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Persona</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Étape</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Programmé</TableHead>
                        <TableHead>Envoyé</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sequencesData.sequences
                        .filter((sequence: EmailSequence) => 
                          filters.search === '' ||
                          sequence.leadEmail.toLowerCase().includes(filters.search.toLowerCase()) ||
                          sequence.guideId.toLowerCase().includes(filters.search.toLowerCase())
                        )
                        .map((sequence: EmailSequence) => (
                          <SequenceRow key={sequence.id} sequence={sequence} />
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune séquence trouvée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              Les analytiques détaillées des séquences email seront disponibles prochainement.
              Pour l'instant, consultez les statistiques dans l'onglet "Vue d'ensemble".
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}