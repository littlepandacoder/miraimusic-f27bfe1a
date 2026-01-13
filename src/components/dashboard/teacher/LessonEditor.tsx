import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Upload,
  Trash2,
  Edit,
  ArrowLeft,
  Sparkles,
  Link2,
  Play,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  title: string;
  url: string;
  type: "upload" | "external";
  uploadDate: Date;
  size?: number; // in MB
  duration?: number; // in seconds
}

interface LessonContent {
  id: string;
  title: string;
  description: string;
  duration: number;
  moduleId: string;
  videos: Video[];
  notes: string;
  aiSuggestions: string;
  status: "draft" | "published";
}

const LessonEditor = () => {
  const { moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<LessonContent>({
    id: lessonId || "",
    title: "",
    description: "",
    duration: 20,
    moduleId: moduleId || "",
    videos: [],
    notes: "",
    aiSuggestions: "",
    status: "draft",
  });

  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load lesson from DB if editing an existing lesson
  useEffect(() => {
    const load = async () => {
      try {
        if (!lessonId || lessonId === "new") return;

        // First check for a preview saved session in localStorage and apply it as defaults
        try {
          const previewRaw = localStorage.getItem(`lesson_preview:${lessonId}`);
          if (previewRaw) {
            const preview = JSON.parse(previewRaw);
            setLesson((prev) => ({
              ...prev,
              ...preview,
              id: preview.id || prev.id,
            }));
          }
        } catch (e) {
          // ignore localStorage parse errors
        }

        const { data: lessonRow, error: lessonErr } = await (supabase as any)
          .from("module_lessons")
          .select("*")
          .eq("id", lessonId)
          .single();

        if (lessonErr || !lessonRow) {
          console.debug("Could not load lesson from DB:", lessonErr?.message || lessonErr);
          return;
        }

        // Load videos
        const { data: videos, error: videosErr } = await (supabase as any)
          .from("lesson_videos")
          .select("*")
          .eq("lesson_id", lessonId)
          .order("created_at", { ascending: true });

        const mappedVideos: Video[] = (videos || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          url: v.url,
          type: v.source === "supabase" || v.source === "loveable" ? "upload" : "external",
          uploadDate: v.created_at ? new Date(v.created_at) : new Date(),
          size: v.size_bytes ? Math.round((v.size_bytes as number) / (1024 * 1024)) : undefined,
          duration: v.duration_seconds || undefined,
        }));

        // Merge DB values but keep preview defaults (preview wins)
        setLesson((prev) => ({
          id: lessonRow.id,
          title: prev.title || lessonRow.title || "",
          description: prev.description || lessonRow.description || "",
          duration: prev.duration || lessonRow.duration_minutes || 20,
          moduleId: lessonRow.module_id || prev.moduleId,
          videos: prev.videos && prev.videos.length ? prev.videos : mappedVideos,
          notes: prev.notes || "",
          aiSuggestions: prev.aiSuggestions || "",
          status: lessonRow.status || prev.status || "draft",
        }));
      } catch (err) {
        console.error("Error loading lesson:", err);
      }
    };

    load();
  }, [lessonId]);

  // Save lesson (local state only - database tables not yet created)
  const handleSaveLesson = async (): Promise<string | null> => {
    setIsSaving(true);
    try {
      // If this is a new lesson (no id or lessonId === 'new'), insert
      if (!lesson.id || lessonId === "new") {
        const insertPayload = {
          module_id: lesson.moduleId,
          title: lesson.title,
          description: lesson.description,
          duration_minutes: lesson.duration,
          status: lesson.status,
        };

        const { data, error } = await (supabase as any).from("module_lessons").insert(insertPayload).select("*").single();
        if (error || !data) {
          console.error("Failed to create lesson:", error);
          toast({ title: "Error", description: "Failed to create lesson.", variant: "destructive" });
          return null;
        }

        setLesson((prev) => ({ ...prev, id: data.id }));
        toast({ title: "Lesson created", description: "Lesson saved to database." });
        return data.id;
      }

      // Otherwise update existing
      const { error } = await (supabase as any).from("module_lessons").update({
        title: lesson.title,
        description: lesson.description,
        duration_minutes: lesson.duration,
        status: lesson.status,
        updated_at: new Date().toISOString(),
      }).eq("id", lesson.id);

      if (error) {
        console.error("Failed to update lesson:", error);
        toast({ title: "Error", description: "Failed to update lesson.", variant: "destructive" });
        return null;
      }

      toast({ title: "Lesson saved", description: "Changes saved." });
      return lesson.id;
    } catch (err) {
      console.error("Save lesson error:", err);
      toast({ title: "Error", description: "Unexpected error saving lesson.", variant: "destructive" });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Add video from external URL
  const handleAddExternalVideo = () => {
    if (!videoUrl.trim() || !videoTitle.trim()) return;

    const newVideo: Video = {
      id: Date.now().toString(),
      title: videoTitle,
      url: videoUrl,
      type: "external",
      uploadDate: new Date(),
    };

    setLesson((prev) => ({
      ...prev,
      videos: [...prev.videos, newVideo],
    }));

    setVideoUrl("");
    setVideoTitle("");
    setIsVideoDialogOpen(false);

    // Persist to DB if lesson exists; if not, create lesson first
    (async () => {
      try {
        let lessonId = lesson.id;
        if (!lessonId) {
          lessonId = await handleSaveLesson() || undefined;
        }
        if (!lessonId) return;

        const { error } = await (supabase as any).from("lesson_videos").insert({
          lesson_id: lessonId,
          title: newVideo.title,
          url: newVideo.url,
          source: "external",
        });
        if (error) {
          console.debug("Could not save external video to DB:", error.message || error);
        } else {
          toast({ title: "Saved", description: "External video saved to lesson." });
        }
      } catch (err) {
        console.error("Error saving external video:", err);
      }
    })();
  };

  // Handle video file upload
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadVideo = async () => {
    if (!videoFile || !videoTitle.trim()) return;

    setUploadProgress(1);
    try {
      // Upload to Supabase storage (bucket: lesson-videos)
      const fileExt = videoFile.name.split(".").pop();
      const filePath = `${user?.id || "unknown"}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("lesson-videos")
        .upload(filePath, videoFile, { upsert: false });

      if (uploadErr) {
        console.error("Upload error:", uploadErr);
        // fallback to local object URL
        const fallbackVideo: Video = {
          id: Date.now().toString(),
          title: videoTitle,
          url: URL.createObjectURL(videoFile),
          type: "upload",
          uploadDate: new Date(),
          size: Math.round(videoFile.size / (1024 * 1024)),
        };

        setLesson((prev) => ({ ...prev, videos: [...prev.videos, fallbackVideo] }));
        toast({ title: "Upload failed", description: "Saved locally for now." });
      } else {
        const { data: urlData } = supabase.storage.from("lesson-videos").getPublicUrl(filePath);
        const publicUrl = urlData?.publicUrl || "";

        const savedVideo: Video = {
          id: Date.now().toString(),
          title: videoTitle,
          url: publicUrl,
          type: "upload",
          uploadDate: new Date(),
          size: Math.round(videoFile.size / (1024 * 1024)),
        };

        setLesson((prev) => ({ ...prev, videos: [...prev.videos, savedVideo] }));

        // Ensure lesson exists in DB, then persist video metadata
        try {
          let lessonId = lesson.id;
          if (!lessonId) {
            lessonId = await handleSaveLesson() || undefined;
          }
          if (!lessonId) {
            console.debug("No lesson id available to save video metadata");
          } else {
            const { error: dbErr } = await (supabase as any).from("lesson_videos").insert({
              lesson_id: lessonId,
              title: savedVideo.title,
              url: publicUrl,
              source: "supabase",
              size_bytes: videoFile.size,
            });
            if (dbErr) console.debug("Failed to insert lesson_video:", dbErr.message || dbErr);
            else toast({ title: "Uploaded", description: "Video uploaded and saved to lesson." });
          }
        } catch (dbErr) {
          console.error("Error inserting lesson video into DB:", dbErr);
        }
      }
    } catch (err) {
      console.error("Unexpected upload error:", err);
      toast({ title: "Error", description: "Failed to upload video." });
    } finally {
      setVideoFile(null);
      setVideoTitle("");
      setUploadProgress(0);
      setIsUploadMode(false);
      setIsVideoDialogOpen(false);
    }
  };

  // Delete video
  const handleDeleteVideo = (videoId: string) => {
    setLesson((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.id !== videoId),
    }));
  };

  // Generate AI suggestions
  const handleGenerateAISuggestions = async () => {
    setIsLoadingAI(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const suggestions = `
Based on the lesson "${lesson.title}", here are AI-generated suggestions:

1. **Learning Objectives**: Break down the lesson into 3-5 clear learning objectives for students.
2. **Interactive Elements**: Add a quiz or practice exercise halfway through to reinforce learning.
3. **Real-World Applications**: Include examples of how this concept is used in actual compositions.
4. **Practice Exercises**: Create progressive exercises starting from basic to advanced difficulty.
5. **Assessment**: Add a performance-based assessment where students apply what they've learned.

Recommended Content Structure:
- Introduction (2-3 minutes)
- Main Concept Explanation (5-7 minutes)
- Demonstration (3-5 minutes)
- Practice Session (10-15 minutes)
- Review & Recap (2-3 minutes)
      `;

      setLesson((prev) => ({
        ...prev,
        aiSuggestions: suggestions,
      }));
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      alert("Failed to generate AI suggestions");
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold flex-1">
          {lesson.id ? "Edit Lesson" : "Create New Lesson"}
        </h1>
        <Badge
          variant="secondary"
          className={cn(
            lesson.status === "published"
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          )}
        >
          {lesson.status}
        </Badge>
        <Button onClick={async () => { await handleSaveLesson(); }} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Lesson"}
        </Button>
      </div>

      {/* Info banner */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="py-4">
          <p className="text-sm text-blue-400">
            <strong>Note:</strong> Lessons are currently stored locally. Database tables will be created when you run the foundation migration.
          </p>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lesson Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lesson Info Card */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl">Lesson Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Lesson Title</label>
                <Input
                  value={lesson.title}
                  onChange={(e) =>
                    setLesson({ ...lesson, title: e.target.value })
                  }
                  placeholder="Enter lesson title"
                  className="text-lg h-10 mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Description</label>
                <Textarea
                  value={lesson.description}
                  onChange={(e) =>
                    setLesson({ ...lesson, description: e.target.value })
                  }
                  placeholder="Enter lesson description"
                  className="text-base mt-2 min-h-20"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Duration (minutes)</label>
                <Input
                  type="number"
                  value={lesson.duration}
                  onChange={(e) =>
                    setLesson({
                      ...lesson,
                      duration: parseInt(e.target.value) || 20,
                    })
                  }
                  className="text-lg h-10 mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Videos Section */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Videos & Media</CardTitle>
              <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Video
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Video to Lesson</DialogTitle>
                  </DialogHeader>

                  {!isUploadMode ? (
                    <div className="space-y-4">
                      <Button
                        onClick={() => setIsUploadMode(true)}
                        className="w-full gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Video File
                      </Button>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Video Title</label>
                        <Input
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          placeholder="e.g., Piano Basics Introduction"
                          className="text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                          <Link2 className="w-4 h-4" />
                          Video URL
                        </label>
                        <Input
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                          className="text-base"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsVideoDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddExternalVideo}
                          disabled={!videoUrl.trim() || !videoTitle.trim()}
                        >
                          Add Video
                        </Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        onClick={() => setIsUploadMode(false)}
                        variant="outline"
                      >
                        Back
                      </Button>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Video File</label>
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileChange}
                          className="text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Video Title</label>
                        <Input
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          placeholder="Enter video title"
                          className="text-base"
                        />
                      </div>
                      {videoFile && (
                        <div className="text-sm text-muted-foreground">
                          File: {videoFile.name}
                        </div>
                      )}
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="space-y-2">
                          <div className="text-sm font-semibold">
                            Uploading... {uploadProgress}%
                          </div>
                          <Progress value={uploadProgress} />
                        </div>
                      )}
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsUploadMode(false);
                            setIsVideoDialogOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUploadVideo}
                          disabled={!videoFile || !videoTitle.trim() || uploadProgress > 0}
                        >
                          Upload
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {lesson.videos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No videos added yet</p>
                  <p className="text-sm mt-1">Add videos to enhance your lesson</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lesson.videos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Play className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{video.title}</p>
                          <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {video.type === "upload" ? "Uploaded" : "External"}
                            </Badge>
                            {video.size && <span>{video.size} MB</span>}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteVideo(video.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl">Teacher's Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={lesson.notes}
                onChange={(e) => setLesson({ ...lesson, notes: e.target.value })}
                placeholder="Add notes, tips, or instructions for students..."
                className="min-h-32"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* AI Suggestions Card */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGenerateAISuggestions}
                disabled={isLoadingAI || !lesson.title}
                className="w-full gap-2"
                variant="outline"
              >
                {isLoadingAI ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get AI Suggestions
                  </>
                )}
              </Button>
              {lesson.aiSuggestions && (
                <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {lesson.aiSuggestions}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Publish Section */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {lesson.status === "draft"
                  ? "This lesson is currently a draft and not visible to students."
                  : "This lesson is published and visible to students."}
              </p>
              <Button
                onClick={() =>
                  setLesson((prev) => ({
                    ...prev,
                    status: prev.status === "draft" ? "published" : "draft",
                  }))
                }
                className="w-full"
                variant={lesson.status === "draft" ? "default" : "outline"}
              >
                {lesson.status === "draft" ? "Publish Lesson" : "Unpublish"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LessonEditor;
