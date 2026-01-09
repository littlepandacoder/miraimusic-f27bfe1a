import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, FileText, Plus } from "lucide-react";
import { format } from "date-fns";

interface Lesson {
  id: string;
  student_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  student_name?: string;
  notes?: { id: string; notes: string; is_visible_to_student: boolean }[];
}

const TeacherSchedule = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isNoteVisible, setIsNoteVisible] = useState(true);
  const { toast } = useToast();

  const fetchLessons = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("teacher_id", user.id)
      .gte("scheduled_date", today)
      .order("scheduled_date")
      .order("scheduled_time");

    if (data) {
      const lessonsWithDetails = await Promise.all(
        data.map(async (lesson) => {
          const [profileRes, notesRes] = await Promise.all([
            supabase.from("profiles").select("full_name").eq("user_id", lesson.student_id).single(),
            supabase.from("lesson_notes").select("*").eq("lesson_id", lesson.id).eq("teacher_id", user.id),
          ]);

          return {
            ...lesson,
            student_name: profileRes.data?.full_name || "Unknown",
            notes: notesRes.data || [],
          };
        })
      );
      setLessons(lessonsWithDetails);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLessons();
  }, [user]);

  const handleAddNote = async () => {
    if (!user || !selectedLesson || !newNote.trim()) return;

    const { error } = await supabase.from("lesson_notes").insert({
      lesson_id: selectedLesson.id,
      teacher_id: user.id,
      notes: newNote,
      is_visible_to_student: isNoteVisible,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add note.", variant: "destructive" });
      return;
    }

    toast({ title: "Note added", description: "Lesson note saved successfully." });
    setNewNote("");
    setSelectedLesson(null);
    fetchLessons();
  };

  const handleStatusUpdate = async (lessonId: string, status: string) => {
    const { error } = await supabase.from("lessons").update({ status }).eq("id", lessonId);

    if (error) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
      return;
    }

    toast({ title: "Updated", description: `Lesson marked as ${status}.` });
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
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">My Schedule</h2>

      {loading ? (
        <p className="text-muted-foreground">Loading schedule...</p>
      ) : lessons.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No upcoming lessons scheduled.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="bg-card border-border">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {format(new Date(lesson.scheduled_date), "EEE, MMM d")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span>{lesson.scheduled_time.slice(0, 5)}</span>
                      <span className="text-muted-foreground">({lesson.duration_minutes} min)</span>
                    </div>
                    <div className="font-semibold">{lesson.student_name}</div>
                    <Badge className={getStatusColor(lesson.status)}>{lesson.status}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {lesson.status === "scheduled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(lesson.id, "completed")}
                      >
                        Mark Complete
                      </Button>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLesson(lesson)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Notes ({lesson.notes?.length || 0})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle>Lesson Notes - {lesson.student_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          {lesson.notes && lesson.notes.length > 0 && (
                            <div className="space-y-2">
                              {lesson.notes.map((note) => (
                                <div key={note.id} className="bg-secondary/50 rounded-lg p-3">
                                  <p className="text-sm">{note.notes}</p>
                                  {!note.is_visible_to_student && (
                                    <Badge variant="outline" className="mt-2 text-xs">
                                      Private
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <Textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a note about this lesson..."
                            className="bg-secondary border-border"
                          />
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="visible"
                              checked={isNoteVisible}
                              onChange={(e) => setIsNoteVisible(e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor="visible" className="text-sm">
                              Visible to student
                            </label>
                          </div>

                          <Button onClick={handleAddNote} className="w-full btn-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Note
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;
