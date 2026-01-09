import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";

interface Slot { id: string; teacher_id: string; day_of_week: number; start_time: string; end_time: string; teacher_name?: string; }

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const BookLesson = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSlots = async () => {
      const { data } = await supabase.from("available_slots").select("*").eq("is_active", true);
      if (data) {
        const slotsWithNames = await Promise.all(
          data.map(async (slot) => {
            const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", slot.teacher_id).single();
            return { ...slot, teacher_name: profile?.full_name || "Teacher" };
          })
        );
        setSlots(slotsWithNames);
      }
      setLoading(false);
    };
    fetchSlots();
  }, []);

  const getNextDates = (dayOfWeek: number) => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const weekStart = startOfWeek(addDays(today, i * 7));
      const date = addDays(weekStart, dayOfWeek);
      if (date > today) dates.push(format(date, "yyyy-MM-dd"));
    }
    return dates;
  };

  const handleBook = async () => {
    if (!user || !selectedSlot || !selectedDate) return;
    setBooking(true);
    const slot = slots.find(s => s.id === selectedSlot);
    if (!slot) return;

    const { error } = await supabase.from("lessons").insert({
      student_id: user.id,
      teacher_id: slot.teacher_id,
      scheduled_date: selectedDate,
      scheduled_time: slot.start_time,
      duration_minutes: 45,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to book lesson.", variant: "destructive" });
    } else {
      toast({ title: "Booked!", description: "Your lesson has been scheduled." });
      setSelectedSlot("");
      setSelectedDate("");
    }
    setBooking(false);
  };

  const selectedSlotData = slots.find(s => s.id === selectedSlot);

  if (loading) return <p className="text-muted-foreground">Loading available slots...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Book a Lesson</h2>
      <Card className="bg-card border-border max-w-md">
        <CardHeader><CardTitle>Select a Time Slot</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedSlot} onValueChange={(v) => { setSelectedSlot(v); setSelectedDate(""); }}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Choose a slot" /></SelectTrigger>
            <SelectContent>
              {slots.map((slot) => (
                <SelectItem key={slot.id} value={slot.id}>
                  {DAYS[slot.day_of_week]} {slot.start_time.slice(0,5)} - {slot.teacher_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedSlotData && (
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Choose a date" /></SelectTrigger>
              <SelectContent>
                {getNextDates(selectedSlotData.day_of_week).map((date) => (
                  <SelectItem key={date} value={date}>{format(new Date(date), "EEEE, MMMM d, yyyy")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={handleBook} disabled={!selectedSlot || !selectedDate || booking} className="w-full btn-primary">
            {booking ? "Booking..." : "Book Lesson"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookLesson;
