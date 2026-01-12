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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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

  // Save lesson
  const handleSaveLesson = async () => {
    try {
      // save to supabase
      const { data, error } = await supabase.from('foundation_lessons').upsert({
        id: lesson.id || undefined,
        title: lesson.title,
        description: lesson.description,
        duration_minutes: lesson.duration,
        module_id: lesson.moduleId,
        content: { videos: lesson.videos, notes: lesson.notes },
        created_by: lesson.id ? undefined : user?.id,
        is_published: lesson.status === 'published',
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert('Lesson saved successfully!');
    } catch (err) {
      console.error('Save lesson error:', err);
      alert('Failed to save lesson: ' + String(err));
    }
  };

  // Autosave lesson on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await supabase.from('foundation_lessons').upsert({
          id: lesson.id || undefined,
          title: lesson.title,
          description: lesson.description,
          duration_minutes: lesson.duration,
          module_id: lesson.moduleId,
          content: { videos: lesson.videos, notes: lesson.notes },
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Autosave lesson failed:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [lesson.title, lesson.description, lesson.duration, lesson.videos, lesson.notes]);

  // Add video from external URL
  const handleAddExternalVideo = async () => {
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

    // autosave lesson when teacher adds media
    try {
      await handleSaveLesson();
    } catch (err) {
      console.warn('Autosave failed after adding video:', err);
    }
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

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const newVideo: Video = {
      id: Date.now().toString(),
      title: videoTitle,
      url: URL.createObjectURL(videoFile),
      type: "upload",
      uploadDate: new Date(),
      size: Math.round(videoFile.size / (1024 * 1024)),
      duration: 0, // Would be extracted from actual video
    };

    setLesson((prev) => ({
      ...prev,
      videos: [...prev.videos, newVideo],
    }));

    setVideoFile(null);
    setVideoTitle("");
    setUploadProgress(0);
    setIsUploadMode(false);
    setIsVideoDialogOpen(false);

    // autosave lesson when teacher uploads media
    try {
      await handleSaveLesson();
    } catch (err) {
      console.warn('Autosave failed after video upload:', err);
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
      // Simulate API call to AI service
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
        <h1 className="text-3xl font-bold">
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
      </div>

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
                            {video.size && (
                              <span>{video.size} MB</span>
                            )}
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
              <CardTitle className="text-xl">Teacher Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={lesson.notes}
                onChange={(e) =>
                  setLesson({ ...lesson, notes: e.target.value })
                }
                placeholder="Add internal notes for teachers (not visible to students)"
                className="text-base min-h-24"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Save Actions */}
          <Card className="border-border sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleSaveLesson} className="w-full">
                Save Lesson
              </Button>
              <Button
                onClick={async () => {
                  setLesson({ ...lesson, status: "published" });
                  try {
                    await handleSaveLesson();
                    // Also notify autosave function to mark as published
                    await fetch('/.netlify/functions/autosave-foundation', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ itemType: 'lesson', action: 'update', data: { id: lesson.id, isPublished: true } })
                    });
                  } catch (err) {
                    console.warn('Publish failed:', err);
                  }
                }}
                variant="outline"
                className="w-full"
              >
                Publish
              </Button>
            </CardContent>
          </Card>

          {/* AI Suggestions Card */}
          <Card className="border-border border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleGenerateAISuggestions}
                disabled={isLoadingAI || !lesson.title.trim()}
                className="w-full gap-2"
                variant="outline"
              >
                {isLoadingAI ? (
                  <>
                    <span className="animate-spin">⚙️</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get Suggestions
                  </>
                )}
              </Button>

              {lesson.aiSuggestions && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-primary">
                    AI Suggestions:
                  </p>
                  <div className="text-xs text-muted-foreground bg-background/50 p-3 rounded border border-muted max-h-40 overflow-y-auto">
                    {lesson.aiSuggestions}
                  </div>
                  <Button
                    onClick={() =>
                      setLesson({
                        ...lesson,
                        notes:
                          lesson.notes +
                          "\n\nAI Suggestions:\n" +
                          lesson.aiSuggestions,
                      })
                    }
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                  >
                    Add to Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lesson Stats */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Lesson Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold">{lesson.duration} minutes</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Videos</p>
                <p className="font-semibold">{lesson.videos.length} video(s)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LessonEditor;
