import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay, isAfter, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
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

interface SlotCalendarViewProps {
  slots: TimeSlot[];
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  isLoading?: boolean;
  showTeacherName?: boolean;
  disablePastDates?: boolean;
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
}: SlotCalendarViewProps) => {
  const today = startOfDay(new Date());

  // Get slots available for a specific date
  const getSlotsForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    return slots.filter((slot) => slot.day_of_week === dayOfWeek && slot.is_active);
  };

  // Check if a date has available slots
  const hasAvailableSlots = (date: Date) => {
    return getSlotsForDate(date).length > 0;
  };

  // Disable dates that are in the past or have no slots
  const isDateDisabled = (date: Date) => {
    if (disablePastDates && !isAfter(date, today) && !isSameDay(date, today)) {
      return true;
    }
    return !hasAvailableSlots(date);
  };

  const availableSlotsForSelectedDate = selectedDate ? getSlotsForDate(selectedDate) : [];

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
            }}
            modifiersStyles={{
              hasSlots: {
                fontWeight: "bold",
                backgroundColor: "hsl(var(--primary) / 0.1)",
              },
            }}
          />
          <p className="text-sm text-muted-foreground mt-3">
            Highlighted dates have available time slots
          </p>
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate
              ? `Available Times - ${format(selectedDate, "EEEE, MMMM d")}`
              : "Select a Date First"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading available slots...</p>
          ) : !selectedDate ? (
            <p className="text-muted-foreground">
              Please select a date from the calendar to see available time slots.
            </p>
          ) : availableSlotsForSelectedDate.length === 0 ? (
            <p className="text-muted-foreground">
              No available time slots for this date.
            </p>
          ) : (
            <div className="space-y-3">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SlotCalendarView;
