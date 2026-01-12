import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Clock, Calendar as CalendarIcon, BookOpen, User } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface BookedLesson {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  student_name?: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TeacherSlots = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [bookedLessons, setBookedLessons] = useState<BookedLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newSlot, setNewSlot] = useState({
    day_of_week: "1",
    start_time: "09:00",
    end_time: "09:45",
  });
  const [bulkSlot, setBulkSlot] = useState({
    days: [] as number[],
    start_time: "09:00",
    end_time: "09:45",
  });
  const { toast } = useToast();

  const fetchSlots = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("available_slots")
      .select("*")
      .eq("teacher_id", user.id)
      .order("day_of_week")
      .order("start_time");

    setSlots(data || []);
  };

  const fetchBookedLessons = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("teacher_id", user.id)
      .order("scheduled_date")
      .order("scheduled_time");

    if (data) {
      const lessonsWithNames = await Promise.all(
        data.map(async (lesson) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", lesson.student_id)
            .single();
          return {
            ...lesson,
            student_name: profile?.full_name || "Unknown",
          };
        })
      );
      setBookedLessons(lessonsWithNames);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSlots();
    fetchBookedLessons();
  }, [user]);

  const handleCreateSlot = async () => {
    if (!user) return;

    const { error } = await supabase.from("available_slots").insert({
      teacher_id: user.id,
      day_of_week: parseInt(newSlot.day_of_week),
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to create time slot.", variant: "destructive" });
      return;
    }

    toast({ title: "Slot created", description: "Time slot has been added." });
    setIsDialogOpen(false);
    fetchSlots();
  };

  const handleBulkCreate = async () => {
    if (!user || bulkSlot.days.length === 0) return;

    const slotsToInsert = bulkSlot.days.map((day) => ({
      teacher_id: user.id,
      day_of_week: day,
      start_time: bulkSlot.start_time,
      end_time: bulkSlot.end_time,
    }));

    const { error } = await supabase.from("available_slots").insert(slotsToInsert);

    if (error) {
      toast({ title: "Error", description: "Failed to create time slots.", variant: "destructive" });
      return;
    }

    toast({ title: "Slots created", description: `${bulkSlot.days.length} time slots have been added.` });
    setIsBulkDialogOpen(false);
    setBulkSlot({ days: [], start_time: "09:00", end_time: "09:45" });
    fetchSlots();
  };

  const toggleBulkDay = (day: number) => {
    setBulkSlot((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleToggleActive = async (slotId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("available_slots")
      .update({ is_active: isActive })
      .eq("id", slotId);

    if (error) {
      toast({ title: "Error", description: "Failed to update slot.", variant: "destructive" });
      return;
    }

    fetchSlots();
  };

  const handleDeleteSlot = async (slotId: string) => {
    const { error } = await supabase.from("available_slots").delete().eq("id", slotId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete slot.", variant: "destructive" });
      return;
    }

    toast({ title: "Deleted", description: "Time slot removed." });
    fetchSlots();
  };

  // Get slots for a specific date's day of week
  const getSlotsForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    return slots.filter((slot) => slot.day_of_week === dayOfWeek);
  };

  // Get booked lessons for a specific date
  const getBookedLessonsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookedLessons.filter((lesson) => lesson.scheduled_date === dateStr);
  };

  // Check if date has slots
  const hasSlots = (date: Date) => {
    return getSlotsForDate(date).length > 0;
  };

  // Check if date has booked lessons
  const hasBookedLessons = (date: Date) => {
    return getBookedLessonsForDate(date).length > 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "cancelled":
        return "bg-destructive/20 text-destructive border-destructive/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const selectedDateSlots = selectedDate ? getSlotsForDate(selectedDate) : [];
  const selectedDateLessons = selectedDate ? getBookedLessonsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-semibold">My Available Time Slots</h2>
        <div className="flex gap-2">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Bulk Add
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle>Add Multiple Time Slots</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day, i) => (
                      <Button
                        key={i}
                        type="button"
                        variant={bulkSlot.days.includes(i) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleBulkDay(i)}
                      >
                        {day.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={bulkSlot.start_time}
                      onChange={(e) => setBulkSlot({ ...bulkSlot, start_time: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={bulkSlot.end_time}
                      onChange={(e) => setBulkSlot({ ...bulkSlot, end_time: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleBulkCreate}
                  disabled={bulkSlot.days.length === 0}
                  className="w-full btn-primary"
                >
                  Create {bulkSlot.days.length} Slot{bulkSlot.days.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Create Time Slot</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select
                    value={newSlot.day_of_week}
                    onValueChange={(v) => setNewSlot({ ...newSlot, day_of_week: v })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateSlot} className="w-full btn-primary">
                  Create Slot
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Your Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border border-border pointer-events-auto"
                  modifiers={{
                    hasSlots: (date) => hasSlots(date),
                    hasBookings: (date) => hasBookedLessons(date),
                  }}
                  modifiersStyles={{
                    hasSlots: {
                      fontWeight: "bold",
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                    },
                    hasBookings: {
                      border: "2px solid hsl(var(--primary))",
                      borderRadius: "50%",
                    },
                  }}
                />
                <div className="space-y-1 mt-3">
                  <p className="text-sm text-muted-foreground">
                    Highlighted dates have configured time slots
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary rounded-full inline-block" />
                    Dates with booked lessons
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate
                    ? `Schedule for ${format(selectedDate, "EEEE, MMM d")}`
                    : "Select a Date"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedDate ? (
                  <p className="text-muted-foreground">
                    Select a date to view schedule
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Booked Lessons Section */}
                    {selectedDateLessons.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Booked Lessons
                        </h4>
                        {selectedDateLessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="p-3 rounded-lg bg-primary/10 border border-primary/30"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                  {lesson.scheduled_time.slice(0, 5)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  ({lesson.duration_minutes} min)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {lesson.student_name && (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {lesson.student_name}
                                  </Badge>
                                )}
                                <Badge className={getStatusColor(lesson.status)}>
                                  {lesson.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Available Slots Section */}
                    {selectedDateSlots.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Available Slots
                        </h4>
                        {selectedDateSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                              </span>
                              <Badge variant={slot.is_active ? "default" : "secondary"}>
                                {slot.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={slot.is_active}
                                onCheckedChange={(checked) => handleToggleActive(slot.id, checked)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSlot(slot.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedDateSlots.length === 0 && selectedDateLessons.length === 0 && (
                      <p className="text-muted-foreground">
                        No schedule for {DAYS[selectedDate.getDay()]}s
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>All Time Slots</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading slots...</p>
              ) : slots.length === 0 ? (
                <p className="text-muted-foreground">
                  No time slots configured. Add your available times above.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow key={slot.id} className="border-border">
                        <TableCell className="font-medium">{DAYS[slot.day_of_week]}</TableCell>
                        <TableCell>
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={slot.is_active}
                            onCheckedChange={(checked) => handleToggleActive(slot.id, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSlot(slot.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherSlots;
