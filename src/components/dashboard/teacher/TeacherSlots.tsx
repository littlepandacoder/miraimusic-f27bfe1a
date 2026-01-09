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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TeacherSlots = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_week: "1",
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
    setLoading(false);
  };

  useEffect(() => {
    fetchSlots();
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Available Time Slots</h2>
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

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Your Availability</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading slots...</p>
          ) : slots.length === 0 ? (
            <p className="text-muted-foreground">No time slots configured. Add your available times above.</p>
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
    </div>
  );
};

export default TeacherSlots;
