import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, loading, hasRole, roles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user) {
      console.log('[Dashboard] User roles:', roles);
      console.log('[Dashboard] Has admin?', hasRole("admin"));
      console.log('[Dashboard] Has teacher?', hasRole("teacher"));
      console.log('[Dashboard] Has student?', hasRole("student"));
    }
  }, [loading, user, roles, hasRole]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (hasRole("admin")) {
    return <AdminDashboard />;
  }

  if (hasRole("teacher")) {
    return <TeacherDashboard />;
  }

  if (hasRole("student")) {
    return <StudentDashboard />;
  }

  // Default to student dashboard if no role assigned
  return <StudentDashboard />;
};

export default Dashboard;
