import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

interface Lesson {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  teacher_name?: string;
  notes?: { notes: string }[];
}

const MyLessons = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchLessons = async () => {
      const { data } = await supabase
        .from("lessons")
        .select("*")
        .eq("student_id", user.id)
        .order("scheduled_date", { ascending: false });

      if (data) {
        const lessonsWithDetails = await Promise.all(
          data.map(async (lesson) => {
            const [teacherRes, notesRes] = await Promise.all([
              lesson.teacher_id ? supabase.from("profiles").select("full_name").eq("user_id", lesson.teacher_id).single() : Promise.resolve({ data: null }),
              supabase.from("lesson_notes").select("notes").eq("lesson_id", lesson.id).eq("is_visible_to_student", true),
            ]);
            return { ...lesson, teacher_name: teacherRes.data?.full_name || "TBA", notes: notesRes.data || [] };
          })
        );
        setLessons(lessonsWithDetails);
      }
      setLoading(false);
    };

    fetchLessons();
  }, [user]);

  const handleCancel = async (lessonId: string) => {
    const { error } = await supabase.from("lessons").update({ status: "cancelled" }).eq("id", lessonId);
    if (error) {
      toast({ title: "Error", description: "Failed to cancel lesson.", variant: "destructive" });
    } else {
      toast({ title: "Cancelled", description: "Lesson has been cancelled." });
      setLessons(lessons.map(l => l.id === lessonId ? { ...l, status: "cancelled" } : l));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-cyan/20 text-cyan border-cyan/50";
      case "completed": return "bg-lime/20 text-lime border-lime/50";
      case "cancelled": return "bg-destructive/20 text-destructive border-destructive/50";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading lessons...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">My Lessons</h2>
      {lessons.length === 0 ? (
        <Card className="bg-card border-border"><CardContent className="py-12 text-center"><p className="text-muted-foreground">No lessons yet. Book your first lesson!</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="bg-card border-border">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /><span className="font-medium">{format(new Date(lesson.scheduled_date), "EEE, MMM d, yyyy")}</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-muted-foreground" /><span>{lesson.scheduled_time.slice(0, 5)}</span></div>
                    <span className="text-muted-foreground">with {lesson.teacher_name}</span>
                    <Badge className={getStatusColor(lesson.status)}>{lesson.status}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {lesson.notes && lesson.notes.length > 0 && <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />{lesson.notes.length} notes</Badge>}
                    {lesson.status === "scheduled" && <Button variant="outline" size="sm" onClick={() => handleCancel(lesson.id)}>Cancel</Button>}
                  </div>
                </div>
                {lesson.notes && lesson.notes.length > 0 && (
                  <div className="mt-4 space-y-2">{lesson.notes.map((note, i) => <div key={i} className="bg-secondary/50 rounded-lg p-3 text-sm">{note.notes}</div>)}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLessons;
