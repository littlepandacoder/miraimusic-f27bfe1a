import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, Calendar, BookOpen, Clock } from "lucide-react";
import MyStudents from "./teacher/MyStudents";
import LessonPlans from "./teacher/LessonPlans";
import TeacherSchedule from "./teacher/TeacherSchedule";
import TeacherSlots from "./teacher/TeacherSlots";

const TeacherHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    upcomingLessons: 0,
    lessonPlans: 0,
    activeSlots: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const [studentsRes, lessonsRes, plansRes, slotsRes] = await Promise.all([
        supabase.from("lessons").select("student_id").eq("teacher_id", user.id),
        supabase.from("lessons").select("*", { count: "exact" }).eq("teacher_id", user.id).eq("status", "scheduled").gte("scheduled_date", today),
        supabase.from("lesson_plans").select("*", { count: "exact" }).eq("teacher_id", user.id),
        supabase.from("available_slots").select("*", { count: "exact" }).eq("teacher_id", user.id).eq("is_active", true),
      ]);

      const uniqueStudents = new Set(studentsRes.data?.map(l => l.student_id) || []);

      setStats({
        totalStudents: uniqueStudents.size,
        upcomingLessons: lessonsRes.count || 0,
        lessonPlans: plansRes.count || 0,
        activeSlots: slotsRes.count || 0,
      });
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Students</CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalStudents}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Lessons</CardTitle>
            <Calendar className="w-5 h-5 text-cyan" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.upcomingLessons}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lesson Plans</CardTitle>
            <BookOpen className="w-5 h-5 text-lime" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.lessonPlans}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Time Slots</CardTitle>
            <Clock className="w-5 h-5 text-purple" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeSlots}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/dashboard/lesson-plans" className="feature-card flex items-center gap-4 p-4">
            <BookOpen className="w-8 h-8 text-primary" />
            <div>
              <p className="font-semibold">Create Lesson Plan</p>
              <p className="text-sm text-muted-foreground">Add new materials</p>
            </div>
          </a>
          <a href="/dashboard/schedule" className="feature-card flex items-center gap-4 p-4">
            <Calendar className="w-8 h-8 text-cyan" />
            <div>
              <p className="font-semibold">View Schedule</p>
              <p className="text-sm text-muted-foreground">See upcoming lessons</p>
            </div>
          </a>
          <a href="/dashboard/slots" className="feature-card flex items-center gap-4 p-4">
            <Clock className="w-8 h-8 text-lime" />
            <div>
              <p className="font-semibold">Manage Availability</p>
              <p className="text-sm text-muted-foreground">Set your time slots</p>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

const TeacherDashboard = () => {
  return (
    <DashboardLayout title="Teacher Dashboard" role="teacher">
      <Routes>
        <Route path="/" element={<TeacherHome />} />
        <Route path="/my-students" element={<MyStudents />} />
        <Route path="/lesson-plans" element={<LessonPlans />} />
        <Route path="/schedule" element={<TeacherSchedule />} />
        <Route path="/slots" element={<TeacherSlots />} />
      </Routes>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
