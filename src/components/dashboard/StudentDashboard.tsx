import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, BookOpen, FileText, Clock, Map } from "lucide-react";
import MyLessons from "./student/MyLessons";
import Resources from "./student/Resources";
import BookLesson from "./student/BookLesson";
import ModuleMap from "./student/ModuleMap";

const StudentHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingLessons: 0,
    completedLessons: 0,
    totalNotes: 0,
    nextLesson: null as { scheduled_date: string; scheduled_time: string } | null,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const [upcomingRes, completedRes, notesRes, nextRes] = await Promise.all([
        supabase.from("lessons").select("*", { count: "exact" }).eq("student_id", user.id).eq("status", "scheduled").gte("scheduled_date", today),
        supabase.from("lessons").select("*", { count: "exact" }).eq("student_id", user.id).eq("status", "completed"),
        supabase.from("lesson_notes").select("*", { count: "exact" }).eq("is_visible_to_student", true),
        supabase.from("lessons").select("scheduled_date, scheduled_time").eq("student_id", user.id).eq("status", "scheduled").gte("scheduled_date", today).order("scheduled_date").order("scheduled_time").limit(1).maybeSingle(),
      ]);

      setStats({
        upcomingLessons: upcomingRes.count || 0,
        completedLessons: completedRes.count || 0,
        totalNotes: notesRes.count || 0,
        nextLesson: nextRes.data,
      });
    };

    fetchStats();
  }, [user]);

  const formatNextLesson = () => {
    if (!stats.nextLesson) return "No upcoming lessons";
    const date = new Date(stats.nextLesson.scheduled_date);
    return `${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${stats.nextLesson.scheduled_time.slice(0, 5)}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Lessons</CardTitle>
            <Calendar className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.upcomingLessons}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Lessons</CardTitle>
            <BookOpen className="w-5 h-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.completedLessons}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Teacher Notes</CardTitle>
            <FileText className="w-5 h-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalNotes}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next Lesson</CardTitle>
            <Clock className="w-5 h-5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatNextLesson()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/dashboard/book" className="feature-card flex items-center gap-4 p-4">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="font-semibold">Book a Lesson</p>
              <p className="text-sm text-muted-foreground">Schedule your next class</p>
            </div>
          </Link>
          <Link to="/dashboard/my-lessons" className="feature-card flex items-center gap-4 p-4">
            <Clock className="w-8 h-8 text-cyan-400" />
            <div>
              <p className="font-semibold">My Lessons</p>
              <p className="text-sm text-muted-foreground">View and manage lessons</p>
            </div>
          </Link>
          <Link to="/dashboard/foundation" className="feature-card flex items-center gap-4 p-4">
            <Map className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="font-semibold">Foundation Journey</p>
              <p className="text-sm text-muted-foreground">Learn the fundamentals</p>
            </div>
          </Link>
          <Link to="/dashboard/resources" className="feature-card flex items-center gap-4 p-4">
            <BookOpen className="w-8 h-8 text-green-400" />
            <div>
              <p className="font-semibold">Learning Resources</p>
              <p className="text-sm text-muted-foreground">Access lesson materials</p>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

const StudentDashboard = () => {
  return (
    <DashboardLayout title="Music Lesson Dashboard" role="student">
      <Routes>
        <Route path="/" element={<StudentHome />} />
        <Route path="/my-lessons" element={<MyLessons />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/book" element={<BookLesson />} />
        <Route path="/foundation" element={<ModuleMap />} />
      </Routes>
    </DashboardLayout>
  );
};

export default StudentDashboard;
