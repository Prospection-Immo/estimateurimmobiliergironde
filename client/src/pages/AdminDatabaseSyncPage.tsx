import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Database, CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SyncOperation = {
  type: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
};

type SyncResult = {
  timestamp: string;
  operations: SyncOperation[];
  success: boolean;
  errors: string[];
};

const StatusIcon = ({ status }: { status: SyncOperation['status'] }) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <X className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const StatusBadge = ({ status }: { status: SyncOperation['status'] }) => {
  const variants = {
    success: 'default',
    error: 'destructive',
    warning: 'secondary',
    info: 'outline'
  } as const;

  return (
    <Badge variant={variants[status]} className="gap-1">
      <StatusIcon status={status} />
      {status}
    </Badge>
  );
};

export default function AdminDatabaseSyncPage() {
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const syncMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/db-sync', {
      method: 'POST'
    }),
    onSuccess: (data: SyncResult) => {
      setSyncResult(data);
      if (data.success) {
        toast({
          title: "Synchronisation réussie",
          description: "La base de données a été synchronisée avec succès",
        });
      } else {
        toast({
          title: "Synchronisation avec erreurs",
          description: `${data.errors.length} erreur(s) détectée(s)`,
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      console.error('Sync error:', error);
      
      // Handle 401 Unauthorized - redirect to login
      if (error?.status === 401 || error?.message?.includes('401')) {
        navigate('/admin/login');
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Erreur de synchronisation",
        description: error?.message || "Erreur lors de la synchronisation",
        variant: "destructive"
      });
    }
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-admin-database-sync">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Synchronisation Base de Données
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez la synchronisation entre vos systèmes de base de données
          </p>
        </div>
        
        <Button 
          onClick={handleSync}
          disabled={syncMutation.isPending}
          size="lg"
          data-testid="button-start-sync"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Synchronisation...' : 'Lancer la synchronisation'}
        </Button>
      </div>

      <Card data-testid="card-sync-controls">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Contrôles de Synchronisation
          </CardTitle>
          <CardDescription>
            Testez les connexions et synchronisez votre schéma de base de données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">PostgreSQL</h3>
              <p className="text-sm text-muted-foreground">
                Base principale avec Drizzle ORM
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Supabase Public</h3>
              <p className="text-sm text-muted-foreground">
                Client anonyme pour opérations publiques
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Supabase Admin</h3>
              <p className="text-sm text-muted-foreground">
                Client admin pour opérations privilégiées
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {syncResult && (
        <Card data-testid="card-sync-results">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Résultats de Synchronisation</span>
              <StatusBadge status={syncResult.success ? 'success' : 'error'} />
            </CardTitle>
            <CardDescription>
              Exécuté le {new Date(syncResult.timestamp).toLocaleString('fr-FR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncResult.operations.map((operation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg" data-testid={`operation-${operation.type}`}>
                <StatusIcon status={operation.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">
                      {operation.type.replace(/_/g, ' ').toUpperCase()}
                    </h4>
                    <StatusBadge status={operation.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {operation.message}
                  </p>
                  {operation.details && (
                    <pre className="text-xs bg-background p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(operation.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
            
            {syncResult.errors.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600 flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Erreurs détectées ({syncResult.errors.length})
                  </h4>
                  {syncResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!syncResult && (
        <Card>
          <CardContent className="text-center p-8">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Aucune synchronisation effectuée</h3>
            <p className="text-muted-foreground mb-4">
              Cliquez sur "Lancer la synchronisation" pour tester vos connexions de base de données
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}