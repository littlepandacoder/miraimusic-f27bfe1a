import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, BookOpen, UserPlus, Gamepad2 } from "lucide-react";
import ManageUsers from "./admin/ManageUsers";
import ManageLessons from "./admin/ManageLessons";
import ManageSlots from "./admin/ManageSlots";
import ManageFoundation from "./admin/ManageFoundation";
import LessonEditor from "./teacher/LessonEditor";
import LessonViewer from "./student/LessonViewer";

const AdminHome = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalLessons: 0,
    upcomingLessons: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [studentsRes, teachersRes, lessonsRes, upcomingRes] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact" }).eq("role", "student"),
        supabase.from("user_roles").select("*", { count: "exact" }).eq("role", "teacher"),
        supabase.from("lessons").select("*", { count: "exact" }),
        supabase.from("lessons").select("*", { count: "exact" }).eq("status", "scheduled").gte("scheduled_date", new Date().toISOString().split("T")[0]),
      ]);

      setStats({
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        totalLessons: lessonsRes.count || 0,
        upcomingLessons: upcomingRes.count || 0,
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalStudents}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Teachers</CardTitle>
            <UserPlus className="w-5 h-5 text-cyan" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalTeachers}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Lessons</CardTitle>
            <BookOpen className="w-5 h-5 text-lime" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalLessons}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Lessons</CardTitle>
            <Calendar className="w-5 h-5 text-purple" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.upcomingLessons}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/dashboard/users" className="feature-card flex items-center gap-4 p-4">
            <UserPlus className="w-8 h-8 text-primary" />
            <div>
              <p className="font-semibold">Register New User</p>
              <p className="text-sm text-muted-foreground">Add students or teachers</p>
            </div>
          </a>
          <a href="/dashboard/lessons" className="feature-card flex items-center gap-4 p-4">
            <Calendar className="w-8 h-8 text-cyan" />
            <div>
              <p className="font-semibold">View All Lessons</p>
              <p className="text-sm text-muted-foreground">Manage scheduled lessons</p>
            </div>
          </a>
          <a href="/dashboard/slots" className="feature-card flex items-center gap-4 p-4">
            <BookOpen className="w-8 h-8 text-lime" />
            <div>
              <p className="font-semibold">Manage Time Slots</p>
              <p className="text-sm text-muted-foreground">Set available times</p>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <DashboardLayout title="Admin Dashboard" role="admin">
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/lessons" element={<ManageLessons />} />
        <Route path="/slots" element={<ManageSlots />} />
        <Route path="/foundation" element={<ManageFoundation />} />
        <Route path="/foundation/lesson-editor/:moduleId/:lessonId" element={<LessonEditor />} />
        <Route path="/foundation/lesson-viewer/:moduleId/:lessonId" element={<LessonViewer />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AdminDashboard;
