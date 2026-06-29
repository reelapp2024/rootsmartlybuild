import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  MoreVertical,
  Trash2,
  Merge,
  Download,
  MessageCircle,
  Calendar,
  FileText,
  Plus,
  Image as ImageIcon,
  Clock,
  Mail,
  StickyNote,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface LeadDetailPanelProps {
  lead: {
    id: number;
    name: string;
    phone: string;
    email?: string;
    serviceType: string;
    subservice?: string;
    city: string;
    locality?: string;
    score: number;
    scoreType: "Hot" | "Warm" | "Cold";
    status: string;
    source: string;
    createdAt: string;
    problemDescription?: string;
    budget?: string;
    preferredDate?: string;
    campaign?: string;
    receivedTime?: string;
    utmDetails?: Record<string, string>;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailPanel({ lead, open, onOpenChange }: LeadDetailPanelProps) {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [staffAssigned, setStaffAssigned] = useState("");

  if (!lead) return null;

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

  // Sample data - replace with actual API calls
  const timelineItems = [
    {
      id: 1,
      type: "event",
      title: "Lead Created",
      timestamp: lead.createdAt,
      icon: CheckCircle2,
      color: "text-blue-500"
    },
    {
      id: 2,
      type: "whatsapp",
      title: "Auto message sent",
      content: "Hello! Thank you for contacting us...",
      timestamp: "2024-01-20 10:32 AM",
      icon: MessageCircle,
      color: "text-green-500"
    },
    {
      id: 3,
      type: "note",
      title: "Internal Note",
      content: "Customer called, interested in emergency service",
      timestamp: "2024-01-20 11:15 AM",
      icon: StickyNote,
      color: "text-yellow-500"
    },
    {
      id: 4,
      type: "email",
      title: "Quote sent via email",
      content: "Quote #12345 sent to customer",
      timestamp: "2024-01-20 02:30 PM",
      icon: Mail,
      color: "text-purple-500"
    },
    {
      id: 5,
      type: "event",
      title: "Quote viewed",
      timestamp: "2024-01-20 03:45 PM",
      icon: Eye,
      color: "text-blue-500"
    }
  ];

  const quotes = [
    {
      id: 1,
      quoteNumber: "Q-2024-001",
      amount: "$1,250.00",
      status: "Sent",
      createdAt: "2024-01-20 02:30 PM"
    },
    {
      id: 2,
      quoteNumber: "Q-2024-002",
      amount: "$1,450.00",
      status: "Viewed",
      createdAt: "2024-01-20 03:15 PM"
    }
  ];

  const files = [
    { id: 1, name: "customer-photo-1.jpg", type: "image", url: "#" },
    { id: 2, name: "inspection-1.jpg", type: "image", url: "#" }
  ];

  const handleCall = () => {
    window.location.href = `tel:${lead.phone}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hello ${lead.name}, thank you for contacting us about ${lead.serviceType}.`);
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl overflow-y-auto transition-transform duration-500 ease-in-out"
      >
        {/* Header Section */}
        <SheetHeader className="border-b pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-2xl font-bold flex items-center gap-3">
                {lead.name}
                <button
                  onClick={handleCall}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-lg"
                >
                  <Phone className="h-5 w-5" />
                  {lead.phone}
                </button>
              </SheetTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={getScoreBadgeColor(lead.scoreType)}>
                  {lead.scoreType}
                </Badge>
                <Select defaultValue={lead.status}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Quoted">Quoted</SelectItem>
                    <SelectItem value="Booked">Booked</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Merge className="h-4 w-4 mr-2" />
                  Merge Leads
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>

        {/* Quick Actions Bar - Sticky */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b pb-3 mb-4 -mx-6 px-6 pt-2">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleWhatsApp} variant="outline" size="sm" className="flex-1 min-w-[120px]">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={handleCall} variant="outline" size="sm" className="flex-1 min-w-[120px]">
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </Button>
            <Button variant="outline" size="sm" className="flex-1 min-w-[120px]">
              <FileText className="h-4 w-4 mr-2" />
              Send Quote
            </Button>
            <Button variant="outline" size="sm" className="flex-1 min-w-[120px]">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button variant="outline" size="sm" className="flex-1 min-w-[120px]">
              <StickyNote className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1 - Lead Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Service Type</Label>
                  <p className="font-medium">{lead.serviceType}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Subservice</Label>
                  <p className="font-medium">{lead.subservice || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Problem Description</Label>
                  <p className="font-medium">{lead.problemDescription || "No description provided"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">City / Locality</Label>
                  <p className="font-medium">{lead.city} {lead.locality && `, ${lead.locality}`}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Budget</Label>
                  <p className="font-medium">{lead.budget || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Preferred Date</Label>
                  <p className="font-medium">{lead.preferredDate || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Source / Campaign</Label>
                  <p className="font-medium">{lead.source} {lead.campaign && ` / ${lead.campaign}`}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Received Time</Label>
                  <p className="font-medium">{lead.receivedTime || lead.createdAt}</p>
                </div>
              </div>
              {lead.utmDetails && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    UTM Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    {Object.entries(lead.utmDetails).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span> {value}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>

          {/* Section 3 - Conversation Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 ${item.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {index < timelineItems.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{item.title}</p>
                          <span className="text-xs text-gray-500">{item.timestamp}</span>
                        </div>
                        {item.content && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Section 4 - Files */}
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {files.map((file) => (
                  <div key={file.id} className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <ImageIcon className="h-full w-full p-4 text-gray-400" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
                <button className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors">
                  <Plus className="h-6 w-6 text-gray-400" />
                </button>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </CardContent>
          </Card>

          {/* Section 5 - Quotes & Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quotes & Invoices</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Quote
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{quote.quoteNumber}</p>
                      <p className="text-sm text-gray-500">{quote.amount} • {quote.status}</p>
                      <p className="text-xs text-gray-400">{quote.createdAt}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 6 - Booking Section */}
          <Card>
            <CardHeader>
              <CardTitle>Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Appointment Date</Label>
                  <p className="font-medium mt-1">Not scheduled</p>
                </div>
                <div>
                  <Label>Staff Assigned</Label>
                  <p className="font-medium mt-1">Not assigned</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant="outline" className="mt-1">Not Scheduled</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule Appointment</DialogTitle>
                      <DialogDescription>
                        Select date, time, and assign staff for this appointment.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="staff">Staff Assigned</Label>
                        <Select value={staffAssigned} onValueChange={setStaffAssigned}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select staff" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff1">John Doe</SelectItem>
                            <SelectItem value="staff2">Jane Smith</SelectItem>
                            <SelectItem value="staff3">Mike Johnson</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full" onClick={() => setShowScheduleDialog(false)}>
                        Schedule
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

