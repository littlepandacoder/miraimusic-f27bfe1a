import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, BookOpen, FileText, Clock, Map, TrendingUp, Target, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import MyLessons from "./student/MyLessons";
import Resources from "./student/Resources";
import BookLesson from "./student/BookLesson";
import ModuleMap from "./student/ModuleMap";
import FoundationLessonPlan from "./student/FoundationLessonPlan";

const StudentHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingLessons: 0,
    completedLessons: 0,
    totalNotes: 0,
    nextLesson: null as { scheduled_date: string; scheduled_time: string } | null,
    foundationProgress: 0,
    foundationModulesCompleted: 0,
    foundationModulesTotal: 8,
    performanceScore: 85,
    performanceTrend: "up" as "up" | "down" | "stable",
    hoursLearned: 0,
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

      // Calculate foundation progress from completed lessons
      const foundationModulesCompleted = 2; // Welcome to Piano, Reading Notes
      const foundationModulesTotal = 8;
      const foundationProgress = (foundationModulesCompleted / foundationModulesTotal) * 100;

      // Calculate total hours learned
      const completedCount = completedRes.count || 0;
      const hoursLearned = completedCount * 1; // Assuming 1 hour per lesson on average

      setStats({
        upcomingLessons: upcomingRes.count || 0,
        completedLessons: completedRes.count || 0,
        totalNotes: notesRes.count || 0,
        nextLesson: nextRes.data,
        foundationProgress,
        foundationModulesCompleted,
        foundationModulesTotal,
        performanceScore: 85,
        performanceTrend: "up",
        hoursLearned,
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Performance Score</CardTitle>
            <TrendingUp className="w-5 h-5 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-400">{stats.performanceScore}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.performanceTrend === "up" ? "📈 Improving" : stats.performanceTrend === "down" ? "📉 Declining" : "➡️ Stable"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hours Learned</CardTitle>
            <Clock className="w-5 h-5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.hoursLearned}h</p>
          </CardContent>
        </Card>
      </div>

      {/* Foundation & Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Foundation Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Foundation Modules</p>
                <p className="text-sm font-semibold">{stats.foundationModulesCompleted}/{stats.foundationModulesTotal}</p>
              </div>
              <Progress value={stats.foundationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{Math.round(stats.foundationProgress)}% Complete</p>
            </div>
            <Link to="/dashboard/foundation" className="feature-card flex items-center gap-3 p-3 mt-2 inline-block w-full justify-center rounded">
              <Map className="w-4 h-4" />
              <span>Continue Learning</span>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Learning Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Complete Foundation Modules</span>
                  <span className="font-semibold">{Math.round((stats.foundationModulesCompleted / stats.foundationModulesTotal) * 100)}%</span>
                </div>
                <Progress value={(stats.foundationModulesCompleted / stats.foundationModulesTotal) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Reach 100% Performance</span>
                  <span className="font-semibold">{stats.performanceScore}%</span>
                </div>
                <Progress value={stats.performanceScore} className="h-2" />
              </div>
            </div>
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
        <Route path="/foundation/lesson-plan/:moduleId" element={<FoundationLessonPlan />} />
      </Routes>
    </DashboardLayout>
  );
};

export default StudentDashboard;
