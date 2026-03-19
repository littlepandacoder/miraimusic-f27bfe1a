import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Play, CheckCircle, ChevronLeft, Loader2, Video } from "lucide-react";

interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  sort_order: number;
}

interface ProgressRecord {
  module_id: string;
  completed: boolean;
  watched_seconds: number;
}

const CourseLibrary = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressRecord>>({});
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [modRes, progRes] = await Promise.all([
        supabase.from("course_modules").select("id, title, description, video_url, sort_order").eq("is_published", true).order("sort_order"),
        user ? supabase.from("course_progress").select("module_id, completed, watched_seconds").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      ]);
      setModules(modRes.data || []);
      const map: Record<string, ProgressRecord> = {};
      (progRes.data || []).forEach((p: any) => { map[p.module_id] = p; });
      setProgress(map);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const markComplete = async (moduleId: string) => {
    if (!user) return;
    const existing = progress[moduleId];
    if (existing) {
      await supabase.from("course_progress").update({ completed: true, completed_at: new Date().toISOString() }).eq("user_id", user.id).eq("module_id", moduleId);
    } else {
      await supabase.from("course_progress").insert({ user_id: user.id, module_id: moduleId, completed: true, completed_at: new Date().toISOString() });
    }
    setProgress(prev => ({ ...prev, [moduleId]: { module_id: moduleId, completed: true, watched_seconds: prev[moduleId]?.watched_seconds || 0 } }));
    toast({ title: "Module completed! 🎉" });
  };

  const completedCount = Object.values(progress).filter(p => p.completed).length;
  const totalCount = modules.length;
  const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (activeModule) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setActiveModule(null)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to Course
        </Button>
        <h2 className="text-2xl font-bold">{activeModule.title}</h2>
        {activeModule.description && <p className="text-muted-foreground">{activeModule.description}</p>}

        {activeModule.video_url ? (
          <div className="rounded-xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              src={activeModule.video_url}
              controls
              className="w-full h-full"
              onEnded={() => {
                if (!progress[activeModule.id]?.completed) {
                  markComplete(activeModule.id);
                }
              }}
            />
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Video coming soon</p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-3">
          {progress[activeModule.id]?.completed ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          ) : (
            <Button variant="outline" onClick={() => markComplete(activeModule.id)}>
              Mark as Complete
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Your Course Progress</h3>
            <span className="text-sm text-muted-foreground">{completedCount}/{totalCount} modules</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">{Math.round(overallProgress)}% complete</p>
        </CardContent>
      </Card>

      {modules.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No course modules available yet. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod, idx) => {
            const isCompleted = progress[mod.id]?.completed;
            return (
              <Card
                key={mod.id}
                className={`bg-card border-border cursor-pointer transition-all hover:border-primary/50 hover:scale-[1.01] ${isCompleted ? "border-green-500/30" : ""}`}
                onClick={() => setActiveModule(mod)}
              >
                <CardContent className="py-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isCompleted ? "bg-green-500/10" : "bg-primary/10"}`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <span className="text-sm font-bold text-primary">{idx + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{mod.title}</h3>
                      {mod.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{mod.description}</p>}
                    </div>
                    <Play className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseLibrary;
