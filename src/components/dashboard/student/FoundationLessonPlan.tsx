import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Lock, 
  Check, 
  Star, 
  Music, 
  Piano,
  BookOpen,
  Trophy,
  Zap,
  Target,
  ArrowLeft,
  Play,
  CheckCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface LessonItem {
  id: string;
  title: string;
  description: string;
  duration: number;
  status: "completed" | "in-progress" | "available" | "locked";
}

interface Module {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  status: "locked" | "available" | "in-progress" | "completed";
  lessons: LessonItem[];
  xpReward: number;
  icon: React.ElementType;
  completedLessons: number;
  totalLessons: number;
}

const MODULES_DATA: Record<string, Module> = {
  "1": {
    id: "1",
    title: "Welcome to Piano",
    description: "Learn the basics of the piano keyboard and posture",
    level: "beginner",
    status: "completed",
    xpReward: 100,
    icon: Piano,
    completedLessons: 4,
    totalLessons: 4,
    lessons: [
      {
        id: "1-1",
        title: "Introduction to Piano",
        description: "Learn about the piano keyboard, how keys are arranged, and basic orientation",
        duration: 15,
        status: "completed"
      },
      {
        id: "1-2",
        title: "Proper Posture & Seating",
        description: "Master the correct sitting position and hand posture to prevent injury",
        duration: 20,
        status: "completed"
      },
      {
        id: "1-3",
        title: "Hand Position & Technique",
        description: "Learn finger independence and proper hand formation on the keys",
        duration: 20,
        status: "completed"
      },
      {
        id: "1-4",
        title: "Warm-up Exercises",
        description: "Practice essential finger exercises to prepare for playing",
        duration: 15,
        status: "completed"
      }
    ]
  },
  "2": {
    id: "2",
    title: "Reading Notes",
    description: "Master reading music notes on the staff",
    level: "beginner",
    status: "completed",
    xpReward: 150,
    icon: BookOpen,
    completedLessons: 6,
    totalLessons: 6,
    lessons: [
      {
        id: "2-1",
        title: "The Musical Staff",
        description: "Understand the five lines and four spaces of the music staff",
        duration: 15,
        status: "completed"
      },
      {
        id: "2-2",
        title: "Treble Clef Notes",
        description: "Learn to read notes in the treble clef (high notes)",
        duration: 20,
        status: "completed"
      },
      {
        id: "2-3",
        title: "Bass Clef Notes",
        description: "Learn to read notes in the bass clef (low notes)",
        duration: 20,
        status: "completed"
      },
      {
        id: "2-4",
        title: "Ledger Lines",
        description: "Master notes that extend above and below the staff",
        duration: 15,
        status: "completed"
      },
      {
        id: "2-5",
        title: "Accidentals (Sharps, Flats, Naturals)",
        description: "Learn sharps, flats, and natural symbols",
        duration: 20,
        status: "completed"
      },
      {
        id: "2-6",
        title: "Note Reading Practice",
        description: "Practice reading various notes across the keyboard",
        duration: 25,
        status: "completed"
      }
    ]
  },
  "3": {
    id: "3",
    title: "Rhythm Basics",
    description: "Understand time signatures and note values",
    level: "beginner",
    status: "in-progress",
    xpReward: 125,
    icon: Music,
    completedLessons: 3,
    totalLessons: 5,
    lessons: [
      {
        id: "3-1",
        title: "Note Values & Rests",
        description: "Learn whole notes, half notes, quarter notes, and their corresponding rests",
        duration: 20,
        status: "completed"
      },
      {
        id: "3-2",
        title: "Time Signatures",
        description: "Understand common time signatures (4/4, 3/4, 2/4)",
        duration: 20,
        status: "completed"
      },
      {
        id: "3-3",
        title: "Counting Beats",
        description: "Practice counting beats and understanding rhythm patterns",
        duration: 25,
        status: "completed"
      },
      {
        id: "3-4",
        title: "Rhythm Notation",
        description: "Learn dotted notes and how to read complex rhythms",
        duration: 20,
        status: "in-progress"
      },
      {
        id: "3-5",
        title: "Rhythm Practice",
        description: "Practice clapping and playing rhythmic patterns",
        duration: 25,
        status: "locked"
      }
    ]
  },
  "4": {
    id: "4",
    title: "Your First Chords",
    description: "Learn major and minor triads",
    level: "beginner",
    status: "available",
    xpReward: 175,
    icon: Zap,
    completedLessons: 0,
    totalLessons: 6,
    lessons: [
      {
        id: "4-1",
        title: "Introduction to Chords",
        description: "Understand what chords are and why they matter",
        duration: 15,
        status: "available"
      },
      {
        id: "4-2",
        title: "Major Triads",
        description: "Learn the structure and sound of major chords",
        duration: 20,
        status: "locked"
      },
      {
        id: "4-3",
        title: "Minor Triads",
        description: "Learn the structure and sound of minor chords",
        duration: 20,
        status: "locked"
      },
      {
        id: "4-4",
        title: "Playing Chords on Piano",
        description: "Practice playing major and minor chords",
        duration: 25,
        status: "locked"
      },
      {
        id: "4-5",
        title: "Chord Transitions",
        description: "Learn to smoothly transition between chords",
        duration: 20,
        status: "locked"
      },
      {
        id: "4-6",
        title: "Chord Practice Songs",
        description: "Play simple songs using the chords you've learned",
        duration: 25,
        status: "locked"
      }
    ]
  },
  "5": {
    id: "5",
    title: "Simple Melodies",
    description: "Play your first complete songs",
    level: "beginner",
    status: "locked",
    xpReward: 200,
    icon: Star,
    completedLessons: 0,
    totalLessons: 8,
    lessons: [
      {
        id: "5-1",
        title: "What is a Melody?",
        description: "Understand melodies and how they shape music",
        duration: 15,
        status: "locked"
      },
      {
        id: "5-2",
        title: "Reading Simple Melodies",
        description: "Learn to read simple melodic lines",
        duration: 20,
        status: "locked"
      },
      {
        id: "5-3",
        title: "Mary Had a Little Lamb",
        description: "Play your first complete song",
        duration: 20,
        status: "locked"
      },
      {
        id: "5-4",
        title: "Twinkle Twinkle Little Star",
        description: "Another classic beginner song",
        duration: 20,
        status: "locked"
      },
      {
        id: "5-5",
        title: "Happy Birthday",
        description: "Learn this popular celebration song",
        duration: 20,
        status: "locked"
      },
      {
        id: "5-6",
        title: "Melody Techniques",
        description: "Learn dynamics, phrasing, and expression",
        duration: 25,
        status: "locked"
      },
      {
        id: "5-7",
        title: "Song Arrangement",
        description: "Combine melodies with chords and accompaniment",
        duration: 25,
        status: "locked"
      },
      {
        id: "5-8",
        title: "Melody Performance",
        description: "Record and share your first melody",
        duration: 20,
        status: "locked"
      }
    ]
  }
};

const FoundationLessonPlan = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [currentLesson, setCurrentLesson] = useState<LessonItem | null>(null);
  const [module, setModule] = useState<Module | null>(null);

  useEffect(() => {
    async function load() {
      if (moduleId) {
        // Try to load from DB if available
        const { data: moduleRow } = await supabase.from('foundation_modules').select('*').eq('id', moduleId).single();
        if (moduleRow) {
          setModule({
            id: moduleRow.id,
            title: moduleRow.title,
            description: moduleRow.description || '',
            level: moduleRow.level || 'beginner',
            status: 'available',
            lessons: [],
            xpReward: moduleRow.xp_reward || 0,
            completedLessons: 0,
            totalLessons: 0,
          });

          const { data: lessons } = await supabase.from('foundation_lessons').select('*').eq('module_id', moduleId).order('created_at', { ascending: true });
          const firstUnfinished = (lessons || []).find((l: any) => l.is_published === true);
          if (firstUnfinished) {
            // Navigate to the real lesson viewer page
            navigate(`/dashboard/foundation/lesson-viewer/${moduleId}/${firstUnfinished.id}`);
            return;
          }
        }

        // Fallback to local data
        if (MODULES_DATA[moduleId]) {
          setModule(MODULES_DATA[moduleId]);
          const firstUnfinishedLocal = MODULES_DATA[moduleId].lessons.find(
            l => l.status !== 'completed' && l.status !== 'locked'
          );
          if (firstUnfinishedLocal) {
            setCurrentLesson(firstUnfinishedLocal);
          }
        }
      }
    }

    load();
  }, [moduleId]);

  if (!module) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard/foundation")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Foundation
        </Button>
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Module not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = module.icon;
  const completionPercentage = (module.completedLessons / module.totalLessons) * 100;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/dashboard/foundation")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Foundation Journey
      </Button>

      {/* Module Header */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-2">{module.title}</CardTitle>
                    <p className="text-muted-foreground">{module.description}</p>
                    <Badge className="mt-2 bg-blue-500/20 text-blue-400 border-blue-500/50">
                      {module.level}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Overall Progress</p>
                  <Progress value={completionPercentage} className="w-64 h-3" />
                  <p className="text-sm mt-2 font-semibold">
                    {module.completedLessons} of {module.totalLessons} lessons completed
                  </p>
                </div>
                <div className="text-center">
                  <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">XP Reward</p>
                  <p className="text-2xl font-bold text-yellow-400">{module.xpReward}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={cn(
                "w-full justify-center py-2 text-sm",
                module.status === "completed" ? "bg-green-500/20 text-green-400 border-green-500" :
                module.status === "in-progress" ? "bg-primary/20 text-primary border-primary" :
                module.status === "available" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500" :
                "bg-muted text-muted-foreground border-border"
              )}>
                {module.status.charAt(0).toUpperCase() + module.status.slice(1)}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{module.totalLessons}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lessons List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Lesson Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {module.lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all cursor-pointer",
                  lesson.status === "completed"
                    ? "bg-green-500/10 border-green-500 hover:bg-green-500/20"
                    : lesson.status === "in-progress"
                    ? "bg-primary/10 border-primary hover:bg-primary/20"
                    : lesson.status === "available"
                    ? "bg-cyan-500/10 border-cyan-500 hover:bg-cyan-500/20"
                    : "bg-muted/20 border-border opacity-60 cursor-not-allowed"
                )}
                onClick={() => {
                  if (lesson.status !== "locked") {
                    setCurrentLesson(lesson);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-1 bg-background border-2 border-current">
                      {lesson.status === "completed" ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : lesson.status === "in-progress" ? (
                        <Play className="w-5 h-5 text-primary" />
                      ) : lesson.status === "available" ? (
                        <CheckCircle className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-lg font-bold">{index + 1}. {lesson.title}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.duration} min
                        </span>
                        {lesson.status === "completed" && (
                          <span className="text-green-400 font-semibold">✓ Completed</span>
                        )}
                        {lesson.status === "in-progress" && (
                          <span className="text-primary font-semibold">In Progress</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {lesson.status !== "locked" && (
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentLesson(lesson);
                      }}
                    >
                      {lesson.status === "completed" ? "Review" : lesson.status === "in-progress" ? "Continue" : "Start"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Lesson Detail */}
      {currentLesson && (
        <Card className="bg-card border-border border-primary">
          <CardHeader className="bg-primary/10">
            <CardTitle className="flex items-center justify-between">
              <span>Now Learning: {currentLesson.title}</span>
              <Badge className={cn(
                currentLesson.status === "completed" ? "bg-green-500/20 text-green-400 border-green-500" :
                currentLesson.status === "in-progress" ? "bg-primary/20 text-primary border-primary" :
                "bg-cyan-500/20 text-cyan-400 border-cyan-500"
              )}>
                {currentLesson.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-6">
                <h4 className="text-xl font-bold mb-4">Learning Objectives:</h4>
                <ul className="text-lg text-muted-foreground space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-xl mt-1">•</span>
                    <span>Master the key concepts and techniques covered in this lesson</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl mt-1">•</span>
                    <span>Practice and apply what you've learned through exercises</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl mt-1">•</span>
                    <span>Build your musical foundation progressively</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-3 text-lg">
                <Clock className="w-6 h-6 text-muted-foreground" />
                <span className="text-xl font-semibold">Duration: {currentLesson.duration} minutes</span>
              </div>

              <div className="flex gap-3 pt-4">
                {currentLesson.status === "completed" ? (
                  <>
                    <Button className="flex-1 text-lg py-6">Review Lesson</Button>
                    <Button variant="outline" className="flex-1 text-lg py-6">Take Again</Button>
                  </>
                ) : currentLesson.status === "in-progress" ? (
                  <>
                    <Button className="flex-1 text-lg py-6">Continue Learning</Button>
                    <Button variant="outline" className="flex-1 text-lg py-6">Pause</Button>
                  </>
                ) : (
                  <>
                    <Button className="flex-1 text-lg py-6">Start Lesson</Button>
                    <Button variant="outline" className="flex-1 text-lg py-6">Save for Later</Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FoundationLessonPlan;
