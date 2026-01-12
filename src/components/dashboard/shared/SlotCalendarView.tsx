import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay, isAfter, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimeSlot {
  id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  teacher_name?: string;
}

export interface BookedLesson {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  student_name?: string;
}

interface SlotCalendarViewProps {
  slots: TimeSlot[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  isLoading?: boolean;
  showTeacherName?: boolean;
  disablePastDates?: boolean;
  bookedLessons?: BookedLesson[];
  showBookedLessons?: boolean;
}

const SlotCalendarView = ({
  slots,
  selectedDate,
  onDateSelect,
  selectedSlot,
  onSlotSelect,
  isLoading = false,
  showTeacherName = true,
  disablePastDates = true,
  bookedLessons = [],
  showBookedLessons = false,
}: SlotCalendarViewProps) => {
  const today = startOfDay(new Date());

  // Get slots available for a specific date
  const getSlotsForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    return slots.filter((slot) => slot.day_of_week === dayOfWeek && slot.is_active);
  };

  // Get booked lessons for a specific date
  const getBookedLessonsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookedLessons.filter((lesson) => lesson.scheduled_date === dateStr);
  };

  // Check if a date has available slots
  const hasAvailableSlots = (date: Date) => {
    return getSlotsForDate(date).length > 0;
  };

  // Check if a date has booked lessons
  const hasBookedLessons = (date: Date) => {
    return getBookedLessonsForDate(date).length > 0;
  };

  // Disable dates that are in the past or have no slots
  const isDateDisabled = (date: Date) => {
    if (disablePastDates && !isAfter(date, today) && !isSameDay(date, today)) {
      return true;
    }
    return !hasAvailableSlots(date) && !hasBookedLessons(date);
  };

  const availableSlotsForSelectedDate = selectedDate ? getSlotsForDate(selectedDate) : [];
  const bookedLessonsForSelectedDate = selectedDate ? getBookedLessonsForDate(selectedDate) : [];

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

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Select a Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            disabled={isDateDisabled}
            className="rounded-md border border-border pointer-events-auto"
            modifiers={{
              hasSlots: (date) => hasAvailableSlots(date) && !isDateDisabled(date),
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
              Highlighted dates have available time slots
            </p>
            {showBookedLessons && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary rounded-full inline-block" />
                Dates with booked lessons
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Slots and Booked Lessons */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate
              ? `Schedule - ${format(selectedDate, "EEEE, MMMM d")}`
              : "Select a Date First"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : !selectedDate ? (
            <p className="text-muted-foreground">
              Please select a date from the calendar to see the schedule.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Booked Lessons Section */}
              {showBookedLessons && bookedLessonsForSelectedDate.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Booked Lessons
                  </h4>
                  {bookedLessonsForSelectedDate.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="w-full p-3 rounded-lg bg-primary/10 border border-primary/30"
                    >
                      <div className="flex items-center justify-between">
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
              {availableSlotsForSelectedDate.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Available Slots
                  </h4>
                  {availableSlotsForSelectedDate.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                      className={cn(
                        "w-full justify-start h-auto py-3 px-4",
                        selectedSlot?.id === slot.id && "ring-2 ring-primary"
                      )}
                      onClick={() => onSlotSelect(slot)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </span>
                        </div>
                        {showTeacherName && slot.teacher_name && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {slot.teacher_name}
                          </Badge>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              {availableSlotsForSelectedDate.length === 0 && bookedLessonsForSelectedDate.length === 0 && (
                <p className="text-muted-foreground">
                  No schedule for this date.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SlotCalendarView;
