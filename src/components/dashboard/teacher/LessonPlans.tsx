import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Video, FileText, Upload, Sparkles, BookOpen } from "lucide-react";
import AILessonGenerator from "./AILessonGenerator";

interface LessonPlan {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  created_at: string;
  files: { id: string; file_name: string; file_url: string; file_type: string }[];
}

const LessonPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", video_url: "" });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchPlans = async () => {
    if (!user) return;

    const { data: plansData } = await supabase
      .from("lesson_plans")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (plansData) {
      const plansWithFiles = await Promise.all(
        plansData.map(async (plan) => {
          const { data: files } = await supabase
            .from("lesson_plan_files")
            .select("*")
            .eq("lesson_plan_id", plan.id);
          return { ...plan, files: files || [] };
        })
      );
      setPlans(plansWithFiles);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, [user]);

  const handleSave = async () => {
    if (!user || !formData.title) {
      toast({
        title: "Title required",
        description: "Please enter a title for the lesson plan.",
        variant: "destructive",
      });
      return;
    }

    if (editingPlan) {
      const { error } = await supabase
        .from("lesson_plans")
        .update({
          title: formData.title,
          description: formData.description,
          video_url: formData.video_url || null,
        })
        .eq("id", editingPlan.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update lesson plan.", variant: "destructive" });
        return;
      }

      toast({ title: "Updated", description: "Lesson plan updated successfully." });
    } else {
      const { error } = await supabase.from("lesson_plans").insert({
        teacher_id: user.id,
        title: formData.title,
        description: formData.description,
        video_url: formData.video_url || null,
      });

      if (error) {
        toast({ title: "Error", description: "Failed to create lesson plan.", variant: "destructive" });
        return;
      }

      toast({ title: "Created", description: "Lesson plan created successfully." });
    }

    setFormData({ title: "", description: "", video_url: "" });
    setEditingPlan(null);
    setIsDialogOpen(false);
    fetchPlans();
  };

  const handleDelete = async (planId: string) => {
    const { error } = await supabase.from("lesson_plans").delete().eq("id", planId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete lesson plan.", variant: "destructive" });
      return;
    }

    toast({ title: "Deleted", description: "Lesson plan deleted." });
    fetchPlans();
  };

  const handleEdit = (plan: LessonPlan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || "",
      video_url: plan.video_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (planId: string, file: File) => {
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `${user?.id}/${planId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("lesson-materials")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("lesson-materials").getPublicUrl(filePath);

    const { error: dbError } = await supabase.from("lesson_plan_files").insert({
      lesson_plan_id: planId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
    });

    if (dbError) {
      toast({ title: "Error", description: "Failed to save file info.", variant: "destructive" });
    } else {
      toast({ title: "Uploaded", description: "File uploaded successfully." });
      fetchPlans();
    }

    setUploading(false);
  };

  const handleDeleteFile = async (fileId: string, fileUrl: string) => {
    // Extract path from URL
    const path = fileUrl.split("/lesson-materials/")[1];
    
    await supabase.storage.from("lesson-materials").remove([path]);
    await supabase.from("lesson_plan_files").delete().eq("id", fileId);
    
    toast({ title: "Deleted", description: "File removed." });
    fetchPlans();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            My Lesson Plans
          </TabsTrigger>
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <AILessonGenerator />
        </TabsContent>

        <TabsContent value="plans">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Lesson Plans</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingPlan(null);
            setFormData({ title: "", description: "", video_url: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Lesson Plan" : "Create Lesson Plan"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Beginner Piano Scales"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the lesson content and objectives..."
                  className="bg-secondary border-border min-h-32"
                />
              </div>
              <div className="space-y-2">
                <Label>Video URL (YouTube, Vimeo, etc.)</Label>
                <Input
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="bg-secondary border-border"
                />
              </div>
              <Button onClick={handleSave} className="w-full btn-primary">
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading lesson plans...</p>
      ) : plans.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No lesson plans yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="bg-card border-border">
              <CardHeader className="flex flex-row items-start justify-between">
                <CardTitle className="text-lg">{plan.title}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.description && (
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                )}
                
                {plan.video_url && (
                  <div className="flex items-center gap-2 text-sm text-cyan">
                    <Video className="w-4 h-4" />
                    <a href={plan.video_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      View Video
                    </a>
                  </div>
                )}

                {plan.files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Attached Files:</p>
                    {plan.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                            {file.file_name}
                          </a>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.id, file.file_url)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <Label htmlFor={`file-${plan.id}`} className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Upload className="w-4 h-4" />
                      {uploading ? "Uploading..." : "Upload File"}
                    </div>
                  </Label>
                  <input
                    id={`file-${plan.id}`}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(plan.id, file);
                    }}
                    disabled={uploading}
                  />
                </div>
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

export default LessonPlans;
