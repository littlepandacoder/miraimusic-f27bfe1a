import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  student_id: string;
  teacher_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  student_name?: string;
  teacher_name?: string;
}

const ManageLessons = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .order("scheduled_date", { ascending: false });

    if (error) {
      console.error("Error fetching lessons:", error);
      return;
    }

    // Fetch student and teacher names
    const lessonsWithNames = await Promise.all(
      (data || []).map(async (lesson) => {
        const [studentProfile, teacherProfile] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("user_id", lesson.student_id).single(),
          lesson.teacher_id
            ? supabase.from("profiles").select("full_name").eq("user_id", lesson.teacher_id).single()
            : Promise.resolve({ data: null }),
        ]);

        return {
          ...lesson,
          student_name: studentProfile.data?.full_name || "Unknown",
          teacher_name: teacherProfile.data?.full_name || "Unassigned",
        };
      })
    );

    setLessons(lessonsWithNames);
    setLoading(false);
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleStatusChange = async (lessonId: string, newStatus: string) => {
    const { error } = await supabase
      .from("lessons")
      .update({ status: newStatus })
      .eq("id", lessonId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update lesson status.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Status updated",
      description: "Lesson status has been updated.",
    });

    fetchLessons();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-cyan/20 text-cyan border-cyan/50";
      case "completed":
        return "bg-lime/20 text-lime border-lime/50";
      case "cancelled":
        return "bg-destructive/20 text-destructive border-destructive/50";
      case "rescheduled":
        return "bg-yellow/20 text-yellow border-yellow/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">All Lessons</h2>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Lesson Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading lessons...</p>
          ) : lessons.length === 0 ? (
            <p className="text-muted-foreground">No lessons scheduled yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map((lesson) => (
                  <TableRow key={lesson.id} className="border-border">
                    <TableCell>
                      {new Date(lesson.scheduled_date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{lesson.scheduled_time.slice(0, 5)}</TableCell>
                    <TableCell className="font-medium">{lesson.student_name}</TableCell>
                    <TableCell>{lesson.teacher_name}</TableCell>
                    <TableCell>{lesson.duration_minutes} min</TableCell>
                    <TableCell>
                      <Select
                        value={lesson.status}
                        onValueChange={(v) => handleStatusChange(lesson.id, v)}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={getStatusColor(lesson.status)}>
                            {lesson.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="rescheduled">Rescheduled</SelectItem>
                        </SelectContent>
                      </Select>
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

export default ManageLessons;
