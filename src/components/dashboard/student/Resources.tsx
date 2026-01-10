import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, FileText, ExternalLink, BookOpen, MessageCircle } from "lucide-react";
import AITutor from "./AITutor";

interface LessonPlan {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  files: { file_name: string; file_url: string }[];
}

const Resources = () => {
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase.from("lesson_plans").select("*").order("created_at", { ascending: false });
      if (data) {
        const plansWithFiles = await Promise.all(
          data.map(async (plan) => {
            const { data: files } = await supabase.from("lesson_plan_files").select("file_name, file_url").eq("lesson_plan_id", plan.id);
            return { ...plan, files: files || [] };
          })
        );
        setPlans(plansWithFiles);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading resources...</p>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="resources" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Learning Resources
          </TabsTrigger>
          <TabsTrigger value="tutor" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            AI Music Tutor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutor">
          <AITutor lessonContext={selectedLesson ? { title: selectedLesson.title, description: selectedLesson.description } : undefined} />
        </TabsContent>

        <TabsContent value="resources">
          <h2 className="text-xl font-semibold mb-4">Learning Resources</h2>
          {plans.length === 0 ? (
            <Card className="bg-card border-border"><CardContent className="py-12 text-center"><p className="text-muted-foreground">No resources available yet.</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`bg-card border-border cursor-pointer transition-all hover:border-primary ${selectedLesson?.id === plan.id ? 'border-primary ring-1 ring-primary' : ''}`}
                  onClick={() => setSelectedLesson(plan)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {plan.title}
                      {selectedLesson?.id === plan.id && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Selected</span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plan.description && <p className="text-muted-foreground text-sm">{plan.description}</p>}
                    {plan.video_url && <a href={plan.video_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 text-cyan hover:underline"><Video className="w-4 h-4" />Watch Video<ExternalLink className="w-3 h-3" /></a>}
                    {plan.files.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Files:</p>
                        {plan.files.map((file, i) => <a key={i} href={file.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 text-sm text-primary hover:underline"><FileText className="w-4 h-4" />{file.file_name}</a>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Resources;
