import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calculator, 
  Phone, 
  TrendingUp, 
  Search, 
  MoreHorizontal,
  Mail,
  MapPin
} from "lucide-react";

// TODO: remove mock data functionality
const mockLeads = [
  {
    id: "1",
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie.dupont@email.com",
    phone: "06 12 34 56 78",
    propertyType: "Appartement",
    city: "Bordeaux",
    surface: 75,
    estimatedValue: 285000,
    status: "new",
    createdAt: "2024-01-15"
  },
  {
    id: "2", 
    firstName: "Jean",
    lastName: "Martin",
    email: "jean.martin@email.com",
    phone: "06 98 76 54 32",
    propertyType: "Maison",
    city: "Mérignac",
    surface: 120,
    estimatedValue: 420000,
    status: "contacted",
    createdAt: "2024-01-14"
  },
  {
    id: "3",
    firstName: "Sophie",
    lastName: "Bernard",
    email: "sophie.bernard@email.com",
    phone: "06 11 22 33 44",
    propertyType: "Maison",
    city: "Pessac",
    surface: 95,
    estimatedValue: 340000,
    status: "new",
    createdAt: "2024-01-13"
  }
];

const mockStats = {
  totalLeads: 156,
  newLeads: 23,
  estimationsToday: 12,
  conversionRate: 18.5
};

interface AdminDashboardProps {
  domain?: string;
}

export default function AdminDashboard({ domain = "estimation-immobilier-gironde.fr" }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const getStatusBadge = (status: string) => {
    const variants = {
      new: { variant: "default" as const, label: "Nouveau" },
      contacted: { variant: "secondary" as const, label: "Contacté" },
      converted: { variant: "default" as const, label: "Converti" },
      archived: { variant: "outline" as const, label: "Archivé" }
    };
    return variants[status as keyof typeof variants] || variants.new;
  };

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || lead.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Gestion des leads et estimations pour {domain}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-leads">{mockStats.totalLeads}</p>
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
                <p className="text-2xl font-bold" data-testid="text-new-leads">{mockStats.newLeads}</p>
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
                <p className="text-2xl font-bold" data-testid="text-estimations-today">{mockStats.estimationsToday}</p>
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
                <p className="text-2xl font-bold" data-testid="text-conversion-rate">{mockStats.conversionRate}%</p>
                <p className="text-sm text-muted-foreground">Taux conversion</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leads" data-testid="tab-leads">Leads</TabsTrigger>
            <TabsTrigger value="estimations" data-testid="tab-estimations">Estimations</TabsTrigger>
            <TabsTrigger value="contacts" data-testid="tab-contacts">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-6">
            {/* Filters */}
            <Card className="p-6">
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
                          <Badge 
                            variant={getStatusBadge(lead.status).variant}
                            data-testid={`badge-status-${lead.id}`}
                          >
                            {getStatusBadge(lead.status).label}
                          </Badge>
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
                            <span>{lead.city}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-semibold">
                          {lead.estimatedValue?.toLocaleString()} €
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.propertyType} - {lead.surface} m²
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

          <TabsContent value="estimations">
            <Card className="p-6">
              <p className="text-muted-foreground">Gestion des estimations - En cours de développement</p>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card className="p-6">
              <p className="text-muted-foreground">Messages de contact - En cours de développement</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}