import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

  useEffect(() => {
    if (!user) return;

    const fetchStudents = async () => {
      // Get all lessons for this teacher
      const { data: lessons } = await supabase
        .from("lessons")
        .select("student_id, status, scheduled_date, scheduled_time")
        .eq("teacher_id", user.id);

      if (!lessons) {
        setLoading(false);
        return;
      }

      // Group by student
      const studentMap = new Map<string, { total: number; completed: number; nextLesson?: string }>();
      
      lessons.forEach((lesson) => {
        const current = studentMap.get(lesson.student_id) || { total: 0, completed: 0 };
        current.total++;
        if (lesson.status === "completed") current.completed++;
        
        if (lesson.status === "scheduled") {
          const lessonDateTime = `${lesson.scheduled_date}T${lesson.scheduled_time}`;
          if (!current.nextLesson || lessonDateTime < current.nextLesson) {
            current.nextLesson = lessonDateTime;
          }
        }
        
        studentMap.set(lesson.student_id, current);
      });

      // Fetch student profiles
      const studentList: Student[] = [];
      for (const [studentId, stats] of studentMap) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", studentId)
          .single();

        if (profile) {
          studentList.push({
            id: studentId,
            full_name: profile.full_name,
            email: profile.email,
            total_lessons: stats.total,
            completed_lessons: stats.completed,
            next_lesson: stats.nextLesson,
          });
        }
      }

      setStudents(studentList);
      setLoading(false);
    };

    fetchStudents();
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">My Students</h2>

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
