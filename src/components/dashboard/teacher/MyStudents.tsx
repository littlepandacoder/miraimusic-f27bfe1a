import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Student {
  id: string;
  full_name: string;
  email: string;
  total_lessons: number;
  completed_lessons: number;
  next_lesson?: string;
}

const MyStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchStudents = async () => {
      setLoading(true);
      // First, gather students from explicit teacher_students table (teacher-assigned)
      const { data: explicitStudents } = await supabase
        .from("teacher_students")
        .select("student_id")
        .eq("teacher_id", user.id);

      const explicitIds = (explicitStudents || []).map((r: any) => r.student_id);

      // Get students that have lessons with this teacher as well
      const { data: lessons } = await supabase
        .from("lessons")
        .select("student_id, status, scheduled_date, scheduled_time")
        .eq("teacher_id", user.id);

      // Combine ids
      const idSet = new Set<string>();
      explicitIds.forEach((id) => idSet.add(id));
      (lessons || []).forEach((l: any) => idSet.add(l.student_id));

      if (idSet.size === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = Array.from(idSet);

      // Fetch profiles for these students
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", studentIds);

      // For each student, compute stats from lessons
      const studentStats = new Map<string, { total: number; completed: number; nextLesson?: string }>();
      (lessons || []).forEach((lesson: any) => {
        const curr = studentStats.get(lesson.student_id) || { total: 0, completed: 0 };
        curr.total++;
        if (lesson.status === "completed") curr.completed++;
        if (lesson.status === "scheduled") {
          const lessonDateTime = `${lesson.scheduled_date}T${lesson.scheduled_time}`;
          if (!curr.nextLesson || lessonDateTime < curr.nextLesson) curr.nextLesson = lessonDateTime;
        }
        studentStats.set(lesson.student_id, curr);
      });

      const studentList: Student[] = (profiles || []).map((p: any) => ({
        id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        total_lessons: studentStats.get(p.user_id)?.total || 0,
        completed_lessons: studentStats.get(p.user_id)?.completed || 0,
        next_lesson: studentStats.get(p.user_id)?.nextLesson,
      }));

      setStudents(studentList);
      setLoading(false);
    };

    fetchStudents();
  }, [user, refresh]);

  // New: add student by email
  const [addEmail, setAddEmail] = useState("");
  const handleAddStudentByEmail = async () => {
    if (!addEmail || !user) return;
    const { data: profile } = await supabase.from("profiles").select("user_id, email").eq("email", addEmail).single();
    if (!profile) {
      alert("No user with that email exists");
      return;
    }

    const { error } = await supabase.from("teacher_students").insert([{ teacher_id: user.id, student_id: profile.user_id }]);
    if (error) {
      alert("Error assigning student: " + error.message);
      return;
    }

    // Refresh list
    setAddEmail("");
    setRefresh((r) => r + 1);
  };



  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">My Students</h2>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <Input placeholder="Enter student email to add" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
        </div>
        <div>
          <Button className="btn-primary" onClick={handleAddStudentByEmail}>Add Student</Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading students...</p>
          ) : students.length === 0 ? (
            <p className="text-muted-foreground">No students assigned yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Lessons</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Next Lesson</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="border-border">
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.total_lessons}</TableCell>
                    <TableCell>
                      <Badge className="bg-lime/20 text-lime border-lime/50">
                        {student.completed_lessons}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.next_lesson
                        ? new Date(student.next_lesson).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "No upcoming"}
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

export default MyStudents;
