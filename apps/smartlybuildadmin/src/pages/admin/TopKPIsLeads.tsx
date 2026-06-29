import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Search, Plus, Eye, Calendar } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadDetailPanel } from "@/components/admin/LeadDetailPanel";

export default function TopKPIsLeads() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    score: "all",
    source: "all",
    serviceType: "all",
    dateRange: "all"
  });

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Check URL params for leadId
  useEffect(() => {
    const leadId = searchParams.get("leadId");
    if (leadId) {
      const lead = allLeads.find(l => l.id === parseInt(leadId));
      if (lead) {
        setSelectedLead(lead);
        setIsPanelOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Sample leads data - replace with actual API calls
  const allLeads = [
    {
      id: 1,
      name: "John Smith",
      phone: "+1 (555) 123-4567",
      serviceType: "Plumbing",
      city: "New York",
      score: 85,
      scoreType: "Hot",
      status: "New",
      source: "Website",
      createdAt: "2024-01-20 10:30 AM"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      phone: "+1 (555) 234-5678",
      serviceType: "HVAC",
      city: "Los Angeles",
      score: 65,
      scoreType: "Warm",
      status: "Contacted",
      source: "Phone",
      createdAt: "2024-01-20 09:15 AM"
    },
    {
      id: 3,
      name: "Mike Davis",
      phone: "+1 (555) 345-6789",
      serviceType: "Electrical",
      city: "Chicago",
      score: 45,
      scoreType: "Cold",
      status: "New",
      source: "Referral",
      createdAt: "2024-01-20 08:45 AM"
    },
    {
      id: 4,
      name: "Emily Wilson",
      phone: "+1 (555) 456-7890",
      serviceType: "Plumbing",
      city: "Houston",
      score: 92,
      scoreType: "Hot",
      status: "Qualified",
      source: "Website",
      createdAt: "2024-01-20 08:20 AM"
    },
    {
      id: 5,
      name: "David Brown",
      phone: "+1 (555) 567-8901",
      serviceType: "Roofing",
      city: "Phoenix",
      score: 58,
      scoreType: "Warm",
      status: "New",
      source: "Social Media",
      createdAt: "2024-01-20 07:50 AM"
    },
    {
      id: 6,
      name: "Lisa Anderson",
      phone: "+1 (555) 678-9012",
      serviceType: "HVAC",
      city: "Philadelphia",
      score: 78,
      scoreType: "Hot",
      status: "Contacted",
      source: "Website",
      createdAt: "2024-01-20 07:30 AM"
    },
    {
      id: 7,
      name: "Robert Taylor",
      phone: "+1 (555) 789-0123",
      serviceType: "Plumbing",
      city: "San Antonio",
      score: 52,
      scoreType: "Warm",
      status: "New",
      source: "Phone",
      createdAt: "2024-01-20 07:00 AM"
    },
    {
      id: 8,
      name: "Jennifer Martinez",
      phone: "+1 (555) 890-1234",
      serviceType: "Electrical",
      city: "San Diego",
      score: 88,
      scoreType: "Hot",
      status: "Qualified",
      source: "Website",
      createdAt: "2024-01-20 06:45 AM"
    },
    {
      id: 9,
      name: "Michael Chen",
      phone: "+1 (555) 901-2345",
      serviceType: "HVAC",
      city: "Dallas",
      score: 62,
      scoreType: "Warm",
      status: "Contacted",
      source: "Referral",
      createdAt: "2024-01-19 05:30 PM"
    },
    {
      id: 10,
      name: "Amanda White",
      phone: "+1 (555) 012-3456",
      serviceType: "Roofing",
      city: "San Jose",
      score: 95,
      scoreType: "Hot",
      status: "Qualified",
      source: "Website",
      createdAt: "2024-01-19 04:15 PM"
    }
  ];

  // Get badge color based on score type
  const getScoreBadgeColor = (scoreType: string) => {
    switch (scoreType) {
      case "Hot":
        return "bg-red-500 hover:bg-red-600 text-white";
      case "Warm":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "Cold":
        return "bg-gray-500 hover:bg-gray-600 text-white";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white";
    }
  };

  // Filter leads based on search and filters
  const filteredLeads = allLeads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filters.status === "all" || lead.status === filters.status;
    const matchesScore = filters.score === "all" || lead.scoreType === filters.score;
    const matchesSource = filters.source === "all" || lead.source === filters.source;
    const matchesService = filters.serviceType === "all" || lead.serviceType === filters.serviceType;
    
    return matchesSearch && matchesStatus && matchesScore && matchesSource && matchesService;
  });

  // Handle lead detail panel - clicking on row
  const handleRowClick = (leadId: number) => {
    const lead = allLeads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      setIsPanelOpen(true);
      setSearchParams({ leadId: leadId.toString(), panel: "detail" });
    }
  };

  // Handle panel close
  const handlePanelClose = (open: boolean) => {
    setIsPanelOpen(open);
    if (!open) {
      setSearchParams({});
      setSelectedLead(null);
    }
  };

  // Handle phone click - prevent row click
  const handlePhoneClick = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  // Handle checkbox click - prevent row click
  const handleCheckboxClick = (e: React.MouseEvent, leadId: number) => {
    e.stopPropagation();
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  // Handle add lead
  const handleAddLead = () => {
    navigate("/admin/top-kpis/leads?action=add");
  };

  if (loading) {
    return (
      <div className="px-0 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Search and Filters Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {/* Table Header */}
              <div className="grid grid-cols-9 gap-4 pb-3 border-b">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
              {/* Table Rows */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="grid grid-cols-9 gap-4 py-3 border-b">
                  {[...Array(9)].map((_, j) => (
                    <div key={j} className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-0 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-gray-500 mt-2">Manage and track all your leads</p>
        </div>
        <Button onClick={handleAddLead} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Top Bar - Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by phone, name, details..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.score}
                onValueChange={(value) => setFilters({ ...filters, score: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Warm">Warm</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.source}
                onValueChange={(value) => setFilters({ ...filters, source: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.serviceType}
                onValueChange={(value) => setFilters({ ...filters, serviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Roofing">Roofing</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads List</CardTitle>
          <CardDescription>Total: {filteredLeads.length} leads found</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleRowClick(lead.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          setSelectedLeads([...selectedLeads, lead.id]);
                        } else {
                          setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <button
                      onClick={(e) => handlePhoneClick(e, lead.phone)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {lead.phone}
                    </button>
                  </TableCell>
                  <TableCell>{lead.serviceType}</TableCell>
                  <TableCell>{lead.city}</TableCell>
                  <TableCell>
                    <Badge className={getScoreBadgeColor(lead.scoreType)}>
                      {lead.scoreType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(value) => {
                        // Update lead status - prevent row click
                        console.log(`Updating lead ${lead.id} status to ${value}`);
                      }}
                    >
                      <SelectTrigger 
                        className="w-32 h-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Qualified">Qualified</SelectItem>
                        <SelectItem value="Lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{lead.createdAt}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRowClick(lead.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lead Detail Panel */}
      <LeadDetailPanel
        lead={selectedLead}
        open={isPanelOpen}
        onOpenChange={handlePanelClose}
      />
    </div>
  );
}
