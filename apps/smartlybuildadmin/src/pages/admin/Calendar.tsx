import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, User, Clock } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadDetailPanel } from "@/components/admin/LeadDetailPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Appointment {
  id: number;
  customerName: string;
  service: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "In Progress";
  startTime: Date;
  endTime: Date;
  leadId: number;
  staffAssigned?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Sample appointments data - replace with actual API calls
  const appointments: Appointment[] = [
    {
      id: 1,
      customerName: "John Smith",
      service: "Plumbing",
      status: "Scheduled",
      startTime: new Date(2024, 0, 20, 10, 0),
      endTime: new Date(2024, 0, 20, 11, 30),
      leadId: 1,
      staffAssigned: "John Doe"
    },
    {
      id: 2,
      customerName: "Sarah Johnson",
      service: "HVAC",
      status: "In Progress",
      startTime: new Date(2024, 0, 20, 14, 0),
      endTime: new Date(2024, 0, 20, 16, 0),
      leadId: 2,
      staffAssigned: "Jane Smith"
    },
    {
      id: 3,
      customerName: "Mike Davis",
      service: "Electrical",
      status: "Scheduled",
      startTime: new Date(2024, 0, 21, 9, 0),
      endTime: new Date(2024, 0, 21, 10, 30),
      leadId: 3,
      staffAssigned: "Mike Johnson"
    },
    {
      id: 4,
      customerName: "Emily Wilson",
      service: "Plumbing",
      status: "Completed",
      startTime: new Date(2024, 0, 19, 13, 0),
      endTime: new Date(2024, 0, 19, 15, 0),
      leadId: 4,
      staffAssigned: "John Doe"
    },
    {
      id: 5,
      customerName: "David Brown",
      service: "Roofing",
      status: "Scheduled",
      startTime: new Date(2024, 0, 22, 11, 0),
      endTime: new Date(2024, 0, 22, 13, 0),
      leadId: 5
    }
  ];

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "In Progress":
        return "bg-yellow-500 hover:bg-yellow-600 text-white";
      case "Completed":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "Cancelled":
        return "bg-red-500 hover:bg-red-600 text-white";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white";
    }
  };

  // Handle appointment click
  const handleAppointmentClick = (appointment: Appointment) => {
    // Find lead data - in real app, fetch from API
    const leadData = {
      id: appointment.leadId,
      name: appointment.customerName,
      phone: "+1 (555) 123-4567",
      serviceType: appointment.service,
      city: "New York",
      score: 85,
      scoreType: "Hot" as const,
      status: appointment.status,
      source: "Website",
      createdAt: format(appointment.startTime, "yyyy-MM-dd HH:mm")
    };
    setSelectedAppointment(leadData);
    setIsPanelOpen(true);
  };

  // Navigation
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrevious = () => {
    if (view === "day") setCurrentDate(subDays(currentDate, 1));
    else if (view === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNext = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, 1));
    else if (view === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt =>
      isSameDay(apt.startTime, date)
    );
  };

  // Get appointments for week
  const getAppointmentsForWeek = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return appointments.filter(apt =>
      apt.startTime >= weekStart && apt.startTime <= weekEnd
    );
  };

  // Render Day View
  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDay(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-2">
        <div className="text-center font-semibold mb-4">
          {format(currentDate, "EEEE, MMMM d, yyyy")}
        </div>
        <div className="border rounded-lg overflow-hidden">
          {hours.map((hour) => {
            const hourAppointments = dayAppointments.filter(apt =>
              apt.startTime.getHours() === hour
            );
            return (
              <div key={hour} className="border-b flex">
                <div className="w-20 p-2 text-sm text-gray-500 border-r">
                  {hour}:00
                </div>
                <div className="flex-1 p-2">
                  {hourAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => handleAppointmentClick(apt)}
                      className={`mb-2 p-2 rounded cursor-pointer hover:shadow-md transition-shadow ${
                        apt.status === "Scheduled" ? "bg-blue-50 border border-blue-200" :
                        apt.status === "In Progress" ? "bg-yellow-50 border border-yellow-200" :
                        apt.status === "Completed" ? "bg-green-50 border border-green-200" :
                        "bg-red-50 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{apt.customerName}</p>
                          <p className="text-sm">{apt.service}</p>
                        </div>
                        <Badge className={getStatusColor(apt.status)}>
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-xs mt-1">
                        {format(apt.startTime, "h:mm a")} - {format(apt.endTime, "h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate) });
    const weekAppointments = getAppointmentsForWeek();

    return (
      <div className="space-y-2">
        <div className="text-center font-semibold mb-4">
          {format(weekStart, "MMM d")} - {format(endOfWeek(currentDate), "MMM d, yyyy")}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDay(day);
            return (
              <div key={index} className="border rounded-lg p-2 min-h-[200px]">
                <div className={`text-center font-medium mb-2 ${isSameDay(day, new Date()) ? 'text-blue-600' : ''}`}>
                  {format(day, "EEE d")}
                </div>
                <div className="space-y-1">
                  {dayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => handleAppointmentClick(apt)}
                      className={`p-2 rounded text-xs cursor-pointer hover:shadow-md transition-shadow ${
                        apt.status === "Scheduled" ? "bg-blue-50 border border-blue-200" :
                        apt.status === "In Progress" ? "bg-yellow-50 border border-yellow-200" :
                        apt.status === "Completed" ? "bg-green-50 border border-green-200" :
                        "bg-red-50 border border-red-200"
                      }`}
                    >
                      <p className="font-medium truncate">{apt.customerName}</p>
                      <p className="text-xs truncate">{apt.service}</p>
                      <Badge className={`${getStatusColor(apt.status)} text-xs mt-1`}>
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const firstDayOfWeek = monthStart.getDay();
    const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => i);

    return (
      <div className="space-y-2">
        <div className="text-center font-semibold mb-4">
          {format(currentDate, "MMMM yyyy")}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 text-center font-medium text-gray-500">
              {day}
            </div>
          ))}
          {daysBeforeMonth.map((_, index) => (
            <div key={`empty-${index}`} className="p-2"></div>
          ))}
          {monthDays.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            return (
              <div
                key={day.toString()}
                className={`border rounded-lg p-2 min-h-[100px] ${
                  isToday ? "bg-blue-50 border-blue-300" : ""
                } ${!isCurrentMonth ? "opacity-50" : ""}`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => handleAppointmentClick(apt)}
                      className={`p-1 rounded text-xs cursor-pointer hover:shadow-md transition-shadow truncate ${
                        apt.status === "Scheduled" ? "bg-blue-50 border border-blue-200" :
                        apt.status === "In Progress" ? "bg-yellow-50 border border-yellow-200" :
                        apt.status === "Completed" ? "bg-green-50 border border-green-200" :
                        "bg-red-50 border border-red-200"
                      }`}
                      title={`${apt.customerName} - ${apt.service}`}
                    >
                      <p className="font-medium truncate">{apt.customerName}</p>
                      <p className="text-xs truncate">{apt.service}</p>
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <p className="text-xs text-gray-500">+{dayAppointments.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="px-0 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-9 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-5 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

        {/* Calendar View Skeleton */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
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
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-gray-500 mt-2">Manage appointments and bookings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={goToToday} variant="outline">
            Today's View
          </Button>
          <Dialog open={showAddBooking} onOpenChange={setShowAddBooking}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Booking
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Booking</DialogTitle>
                <DialogDescription>
                  Create a new appointment booking.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Input id="customer" placeholder="Select customer" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Input id="service" placeholder="Service type" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="staff">Assign Staff</Label>
                  <Select>
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
                <Button className="w-full" onClick={() => setShowAddBooking(false)}>
                  Create Booking
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <User className="h-4 w-4 mr-2" />
            Assign Staff
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold">
                {view === "day" && format(currentDate, "MMMM d, yyyy")}
                {view === "week" && `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`}
                {view === "month" && format(currentDate, "MMMM yyyy")}
              </div>
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week" | "month")}>
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={view} onValueChange={(v) => setView(v as "day" | "week" | "month")}>
            <TabsContent value="day" className="mt-0">
              {renderDayView()}
            </TabsContent>
            <TabsContent value="week" className="mt-0">
              {renderWeekView()}
            </TabsContent>
            <TabsContent value="month" className="mt-0">
              {renderMonthView()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Lead Detail Panel */}
      <LeadDetailPanel
        lead={selectedAppointment}
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
      />
    </div>
  );
}

