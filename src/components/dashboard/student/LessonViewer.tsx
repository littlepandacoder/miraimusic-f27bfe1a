import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import trackEvent from "@/lib/telemetry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Download, Share2, CheckCircle, Clock } from "lucide-react";
import VideoPlayer from "../shared/VideoPlayer";
import { cn } from "@/lib/utils";

interface Video {
  id: string;
  title: string;
  url: string;
  type: "upload" | "external";
  duration?: number;
}

interface LessonContent {
  id: string;
  title: string;
  description: string;
  duration: number;
  moduleTitle: string;
  videos: Video[];
  notes: string;
  learningObjectives: string[];
  status: "completed" | "in-progress" | "available";
}

interface LessonViewerProps {
  lesson?: LessonContent;
}

// Sample lesson data for demonstration
const SAMPLE_LESSONS: Record<string, LessonContent> = {
  "1-1": {
    id: "1-1",
    title: "Introduction to Piano",
    description: "Learn about the piano keyboard, how keys are arranged, and basic orientation. This lesson covers the fundamental layout of the piano and helps you become familiar with the instrument.",
    duration: 15,
    moduleTitle: "Welcome to Piano",
    videos: [
      { id: "v1", title: "Welcome to Piano", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", type: "external", duration: 300 },
      { id: "v2", title: "Keyboard Layout", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", type: "external", duration: 420 },
    ],
    notes: "Remember to sit at the center of the keyboard with your back straight. The middle C is your reference point for finding all other notes.",
    learningObjectives: [
      "Identify all 88 keys on a standard piano",
      "Locate middle C and understand its importance",
      "Understand the pattern of black and white keys",
      "Learn proper hand positioning on the keyboard"
    ],
    status: "completed"
  },
  "3-4": {
    id: "3-4",
    title: "Rhythm Notation",
    description: "Learn dotted notes and how to read complex rhythms. Understanding rhythm notation is essential for playing music accurately.",
    duration: 20,
    moduleTitle: "Rhythm Basics",
    videos: [
      { id: "v1", title: "Understanding Dotted Notes", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", type: "external", duration: 600 },
    ],
    notes: "A dotted note increases the duration by half of its original value. Practice counting aloud to internalize the rhythm patterns.",
    learningObjectives: [
      "Understand how dots affect note duration",
      "Read and count dotted rhythms",
      "Practice clapping complex rhythm patterns",
      "Apply rhythm notation to simple melodies"
    ],
    status: "in-progress"
  }
};

const LessonViewer = ({ lesson: passedLesson }: LessonViewerProps) => {
  const { moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const { user } = useAuth();

  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  

  // Get lesson from passed props or sample data
  const lesson = passedLesson || (lessonId ? SAMPLE_LESSONS[lessonId] : null);

  useEffect(() => {
    if (!lesson && lessonId && !SAMPLE_LESSONS[lessonId]) {
      setErrorMessage('Lesson not found');
    }
  }, [lessonId, lesson]);

  // Ensure lesson_progress exists for this user & lesson (best-effort)
  useEffect(() => {
    (async () => {
      try {
        if (!user || isPreview || !lesson) return;
        // Upsert a baseline progress row
        const payload = {
          lesson_id: lesson.id,
          student_id: user.id,
          completed: false,
          watched_seconds: 0,
          last_watched_at: new Date().toISOString()
        };
        await (supabase as any).from('lesson_progress').upsert([payload], { onConflict: ['lesson_id', 'student_id'] });

        // Fetch existing progress to set completed state
        const { data: progressData } = await (supabase as any).from('lesson_progress').select('completed').eq('lesson_id', lesson.id).eq('student_id', user.id).limit(1).single();
        if (progressData && progressData.completed) setIsCompleted(true);

        // Track telemetry event: lesson_view
        try { trackEvent('lesson_view', { lessonId: lesson.id, moduleId, userId: user.id }); } catch (e) {}
      } catch (e) {
        // non-blocking
        // eslint-disable-next-line no-console
        console.debug('ensure lesson_progress failed', e);
      }
    })();
  }, [user, isPreview, lesson, moduleId]);

  if (!lesson && errorMessage) {
    return (
      <div className="space-y-6 p-6 max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{errorMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-6 p-6 max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading lesson...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentVideo = lesson.videos?.[selectedVideoIndex] || null;

  const handleDownloadVideo = () => {
    if (!currentVideo) return;
    alert(`Downloading: ${currentVideo.title}`);
  };

  const handleShareVideo = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  const handleCompleteLesson = () => {
    setIsCompleted(true);
    alert("Lesson marked as completed! Great job! 🎉");
    (async () => {
      try {
        if (!user) return;
        await (supabase as any).from('lesson_progress').upsert([{ lesson_id: lesson.id, student_id: user.id, completed: true, watched_seconds: (lesson.videos?.[selectedVideoIndex]?.duration || 0), last_watched_at: new Date().toISOString() }], { onConflict: ['lesson_id', 'student_id'] });
        try { trackEvent('lesson_completed', { lessonId: lesson.id, moduleId, userId: user.id }); } catch (e) {}
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug('Failed to update lesson_progress on complete', e);
      }
    })();
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
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
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{lesson.moduleTitle}</p>
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
        </div>
          {isPreview && (
            <div className="ml-4">
              <span className="inline-block px-3 py-1 rounded bg-yellow-100 text-yellow-800 text-sm font-semibold">Preview</span>
            </div>
          )}
        {isCompleted && (
          <Badge className="bg-green-500/20 text-green-400 flex items-center gap-2 px-3 py-2">
            <CheckCircle className="w-4 h-4" />
            Completed
          </Badge>
        )}
      </div>

      {/* Video Player Section */}
      {currentVideo && (
        <Card className="border-border overflow-hidden">
          <div className="aspect-video bg-black">
            <VideoPlayer
              src={currentVideo.url}
              title={currentVideo.title}
              onDownload={handleDownloadVideo}
              onShare={handleShareVideo}
            />
          </div>
          <CardContent className="p-4">
            <p className="font-semibold">{currentVideo.title}</p>
            {currentVideo.duration && (
              <p className="text-sm text-muted-foreground">
                Duration: {Math.floor(currentVideo.duration / 60)} minutes
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Playlist */}
          {lesson.videos.length > 1 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Video Playlist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lesson.videos.map((video, idx) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideoIndex(idx)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      selectedVideoIndex === idx
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/30 border-muted hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Play className="w-4 h-4 flex-shrink-0 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {idx + 1}. {video.title}
                        </p>
                        {video.duration && (
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(video.duration / 60)} minutes
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tabs Section */}
          <Card className="border-border">
            <CardContent className="p-0">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="objectives">Learning Objectives</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">About This Lesson</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        <span>{lesson.videos.length} videos</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="objectives" className="p-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">What You'll Learn</h3>
                    <ul className="space-y-2">
                      {lesson.learningObjectives.map((objective, idx) => (
                        <li key={idx} className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                              {idx + 1}
                            </div>
                          </div>
                          <p className="text-muted-foreground">{objective}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="p-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Teacher's Notes</h3>
                    <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {lesson.notes}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Your Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold">Lesson Progress</p>
                  <span className="text-sm font-bold text-primary">
                    {selectedVideoIndex + 1}/{lesson.videos.length}
                  </span>
                </div>
                <Progress
                  value={((selectedVideoIndex + 1) / lesson.videos.length) * 100}
                />
              </div>

              {isCompleted ? (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="font-semibold text-green-400 text-sm">
                    Lesson Completed!
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleCompleteLesson}
                  className="w-full"
                  disabled={selectedVideoIndex < lesson.videos.length - 1}
                >
                  Mark as Complete
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Lesson Info Card */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Lesson Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Module</p>
                <p className="font-semibold text-sm">{lesson.moduleTitle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="font-semibold text-sm">{lesson.duration} minutes</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="secondary" className="text-xs">
                  {lesson.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-border border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                After completing this lesson:
              </p>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>Practice the techniques you learned</li>
                <li>Review the teacher's notes</li>
                <li>Proceed to the next lesson when ready</li>
                <li>Reach out to your teacher with questions</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
