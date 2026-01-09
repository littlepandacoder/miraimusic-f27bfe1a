import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  teacher_name?: string;
}

interface Teacher {
  user_id: string;
  full_name: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ManageSlots = () => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    teacher_id: "",
    day_of_week: "1",
    start_time: "09:00",
    end_time: "09:45",
  });
  const { toast } = useToast();

  const fetchData = async () => {
    // Fetch teachers
    const { data: teacherRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "teacher");

    if (teacherRoles) {
      const teacherProfiles = await Promise.all(
        teacherRoles.map(async (t) => {
          const { data } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .eq("user_id", t.user_id)
            .single();
          return data;
        })
      );
      setTeachers(teacherProfiles.filter(Boolean) as Teacher[]);
    }

    // Fetch all slots
    const { data: slotsData } = await supabase
      .from("available_slots")
      .select("*")
      .order("day_of_week")
      .order("start_time");

    if (slotsData) {
      const slotsWithNames = await Promise.all(
        slotsData.map(async (slot) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", slot.teacher_id)
            .single();
          return { ...slot, teacher_name: profile?.full_name || "Unknown" };
        })
      );
      setSlots(slotsWithNames);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSlot = async () => {
    if (!newSlot.teacher_id) {
      toast({
        title: "Select a teacher",
        description: "Please select a teacher for this time slot.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("available_slots").insert({
      teacher_id: newSlot.teacher_id,
      day_of_week: parseInt(newSlot.day_of_week),
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create time slot.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Slot created",
      description: "Time slot has been added successfully.",
    });

    setIsDialogOpen(false);
    fetchData();
  };

  const handleToggleActive = async (slotId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("available_slots")
      .update({ is_active: isActive })
      .eq("id", slotId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update slot status.",
        variant: "destructive",
      });
      return;
    }

    fetchData();
  };

  const handleDeleteSlot = async (slotId: string) => {
    const { error } = await supabase.from("available_slots").delete().eq("id", slotId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete time slot.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Slot deleted",
      description: "Time slot has been removed.",
    });

    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Time Slots Management</h2>
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
                <Label>Teacher</Label>
                <Select
                  value={newSlot.teacher_id}
                  onValueChange={(v) => setNewSlot({ ...newSlot, teacher_id: v })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.user_id} value={t.user_id}>
                        {t.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
          <CardTitle>All Available Time Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading slots...</p>
          ) : slots.length === 0 ? (
            <p className="text-muted-foreground">No time slots configured yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Teacher</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot) => (
                  <TableRow key={slot.id} className="border-border">
                    <TableCell className="font-medium">{slot.teacher_name}</TableCell>
                    <TableCell>{DAYS[slot.day_of_week]}</TableCell>
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

export default ManageSlots;
