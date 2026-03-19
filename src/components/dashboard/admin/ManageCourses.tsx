import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, Upload, Video, Loader2 } from "lucide-react";

interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  is_published: boolean;
}

const ManageCourses = () => {
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // New module form
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const fetchModules = async () => {
    const { data, error } = await supabase
      .from("course_modules")
      .select("*")
      .order("sort_order");
    if (error) {
      toast({ title: "Error loading courses", description: error.message, variant: "destructive" });
    } else {
      setModules(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchModules(); }, []);

  const addModule = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("course_modules").insert({
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      sort_order: modules.length,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Module added" });
      setNewTitle("");
      setNewDescription("");
      setShowForm(false);
      fetchModules();
    }
    setSaving(false);
  };

  const togglePublished = async (mod: CourseModule) => {
    const { error } = await supabase
      .from("course_modules")
      .update({ is_published: !mod.is_published })
      .eq("id", mod.id);
    if (!error) {
      setModules(prev => prev.map(m => m.id === mod.id ? { ...m, is_published: !m.is_published } : m));
    }
  };

  const deleteModule = async (id: string) => {
    if (!confirm("Delete this module and all student progress?")) return;
    const { error } = await supabase.from("course_modules").delete().eq("id", id);
    if (!error) {
      setModules(prev => prev.filter(m => m.id !== id));
      toast({ title: "Module deleted" });
    }
  };

  const handleVideoUpload = async (moduleId: string, file: File) => {
    setUploadingId(moduleId);
    const ext = file.name.split(".").pop();
    const path = `${moduleId}/video.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("course-videos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploadingId(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("course-videos").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("course_modules")
      .update({ video_url: urlData.publicUrl })
      .eq("id", moduleId);

    if (!updateError) {
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, video_url: urlData.publicUrl } : m));
      toast({ title: "Video uploaded!" });
    }
    setUploadingId(null);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Course Modules</h2>
          <p className="text-sm text-muted-foreground">Upload videos and manage your course content</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Add Module
        </Button>
      </div>

      {showForm && (
        <Card className="bg-card border-border">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Introduction to Piano" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="What this module covers..." />
            </div>
            <div className="flex gap-2">
              <Button onClick={addModule} disabled={saving || !newTitle.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Module
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {modules.length === 0 && !showForm ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No course modules yet. Click "Add Module" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((mod, idx) => (
            <Card key={mod.id} className="bg-card border-border">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground pt-1">
                    <GripVertical className="w-4 h-4" />
                    <span className="text-xs font-mono w-6 text-center">{idx + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{mod.title}</h3>
                        {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Switch checked={mod.is_published} onCheckedChange={() => togglePublished(mod)} />
                          <Label className="text-xs">{mod.is_published ? "Published" : "Draft"}</Label>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteModule(mod.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Video upload area */}
                    {mod.video_url ? (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                        <Video className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm truncate flex-1">Video uploaded</span>
                        <label className="cursor-pointer">
                          <Button variant="outline" size="sm" asChild>
                            <span>Replace</span>
                          </Button>
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleVideoUpload(mod.id, e.target.files[0])}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                        {uploadingId === mod.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Click to upload video</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleVideoUpload(mod.id, e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
