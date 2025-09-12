import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsKPISkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} data-testid={`skeleton-kpi-${i}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AnalyticsChartSkeleton({ 
  title = "Chargement...", 
  description = "Données en cours de chargement..." 
}: { 
  title?: string; 
  description?: string; 
}) {
  return (
    <Card data-testid="skeleton-chart">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
          <div className="text-center">
            <Skeleton className="h-4 w-32 mx-auto mb-2" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card data-testid="skeleton-table">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsFiltersSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function AnalyticsErrorState({ 
  error, 
  onRetry, 
  title = "Erreur de chargement" 
}: { 
  error: string; 
  onRetry?: () => void; 
  title?: string; 
}) {
  return (
    <Card data-testid="error-state" className="border-destructive/50">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="text-destructive text-sm font-medium mb-2">{title}</div>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              data-testid="button-retry"
              className="text-sm text-primary hover:underline"
            >
              Réessayer
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsEmptyState({ 
  message = "Aucune donnée disponible", 
  description = "Il n'y a pas de données pour la période sélectionnée." 
}: { 
  message?: string; 
  description?: string; 
}) {
  return (
    <Card data-testid="empty-state">
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="text-muted-foreground text-sm font-medium mb-2">{message}</div>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}