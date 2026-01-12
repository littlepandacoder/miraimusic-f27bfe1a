import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  status: "locked" | "available" | "in-progress" | "completed";
  lessons: number;
  completedLessons: number;
  xpReward: number;
  icon: React.ElementType;
}

const FOUNDATION_MODULES: Module[] = [
  {
    id: "1",
    title: "Welcome to Piano",
    description: "Learn the basics of the piano keyboard and posture",
    level: "beginner",
    status: "completed",
    lessons: 4,
    completedLessons: 4,
    xpReward: 100,
    icon: Piano,
  },
  {
    id: "2",
    title: "Reading Notes",
    description: "Master reading music notes on the staff",
    level: "beginner",
    status: "completed",
    lessons: 6,
    completedLessons: 6,
    xpReward: 150,
    icon: BookOpen,
  },
  {
    id: "3",
    title: "Rhythm Basics",
    description: "Understand time signatures and note values",
    level: "beginner",
    status: "in-progress",
    lessons: 5,
    completedLessons: 3,
    xpReward: 125,
    icon: Music,
  },
  {
    id: "4",
    title: "Your First Chords",
    description: "Learn major and minor triads",
    level: "beginner",
    status: "available",
    lessons: 6,
    completedLessons: 0,
    xpReward: 175,
    icon: Zap,
  },
  {
    id: "5",
    title: "Simple Melodies",
    description: "Play your first complete songs",
    level: "beginner",
    status: "locked",
    lessons: 8,
    completedLessons: 0,
    xpReward: 200,
    icon: Star,
  },
  {
    id: "6",
    title: "Scales & Patterns",
    description: "Major and minor scales across the keyboard",
    level: "intermediate",
    status: "locked",
    lessons: 7,
    completedLessons: 0,
    xpReward: 225,
    icon: Target,
  },
  {
    id: "7",
    title: "Chord Progressions",
    description: "Common progressions used in popular music",
    level: "intermediate",
    status: "locked",
    lessons: 6,
    completedLessons: 0,
    xpReward: 250,
    icon: Music,
  },
  {
    id: "8",
    title: "Music Theory Deep Dive",
    description: "Advanced concepts for serious musicians",
    level: "advanced",
    status: "locked",
    lessons: 10,
    completedLessons: 0,
    xpReward: 500,
    icon: Trophy,
  },
];

const ModuleMap = () => {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const navigate = useNavigate();

  const totalXP = FOUNDATION_MODULES
    .filter(m => m.status === "completed")
    .reduce((sum, m) => sum + m.xpReward, 0);

  const getStatusStyles = (status: Module["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 border-green-500 text-green-400 shadow-green-500/20";
      case "in-progress":
        return "bg-primary/20 border-primary text-primary animate-pulse shadow-primary/30";
      case "available":
        return "bg-cyan-500/20 border-cyan-500 text-cyan-400 hover:scale-105 cursor-pointer";
      case "locked":
        return "bg-muted/50 border-border text-muted-foreground opacity-60";
    }
  };

  const getLevelColor = (level: Module["level"]) => {
    switch (level) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/50";
    }
  };

  const getConnectorStyle = (currentStatus: Module["status"], nextStatus: Module["status"]) => {
    if (currentStatus === "completed") {
      return "bg-gradient-to-b from-green-500 to-green-500";
    }
    if (currentStatus === "in-progress") {
      return "bg-gradient-to-b from-primary/50 to-border";
    }
    return "bg-border";
  };

  return (
    <div className="space-y-6">
      {/* Header with XP */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Foundation Journey</h2>
          <p className="text-muted-foreground">Master the fundamentals of piano</p>
        </div>
        <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div>
              <p className="text-xs text-muted-foreground">Total XP</p>
              <p className="text-xl font-bold text-yellow-400">{totalXP}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Map - Vertical Path */}
      <div className="relative">
        <div className="flex flex-col items-center space-y-4">
          {FOUNDATION_MODULES.map((module, index) => {
            const Icon = module.icon;
            const isEven = index % 2 === 0;
            
            return (
              <div key={module.id} className="w-full max-w-2xl">
                {/* Connector Line */}
                {index > 0 && (
                  <div className="flex justify-center -mt-4 mb-4">
                    <div 
                      className={cn(
                        "w-1 h-8 rounded-full",
                        getConnectorStyle(FOUNDATION_MODULES[index - 1].status, module.status)
                      )}
                    />
                  </div>
                )}

                {/* Module Node */}
                <div 
                  className={cn(
                    "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300",
                    getStatusStyles(module.status),
                    isEven ? "ml-0 mr-auto" : "ml-auto mr-0",
                    "md:max-w-md w-full"
                  )}
                  onClick={() => module.status !== "locked" && setSelectedModule(module)}
                >
                  {/* Module Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center border-2 shrink-0",
                    module.status === "completed" ? "bg-green-500/30 border-green-500" :
                    module.status === "in-progress" ? "bg-primary/30 border-primary" :
                    module.status === "available" ? "bg-cyan-500/30 border-cyan-500" :
                    "bg-muted border-border"
                  )}>
                    {module.status === "completed" ? (
                      <Check className="w-7 h-7 text-green-400" />
                    ) : module.status === "locked" ? (
                      <Lock className="w-6 h-6" />
                    ) : (
                      <Icon className="w-7 h-7" />
                    )}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{module.title}</h3>
                      <Badge className={cn("text-xs", getLevelColor(module.level))}>
                        {module.level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {module.description}
                    </p>
                    
                    {/* Progress Bar */}
                    {(module.status === "in-progress" || module.status === "completed") && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{module.completedLessons}/{module.lessons} lessons</span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            {module.xpReward} XP
                          </span>
                        </div>
                        <Progress 
                          value={(module.completedLessons / module.lessons) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}

                    {module.status === "available" && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span>{module.lessons} lessons</span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          {module.xpReward} XP
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {module.status === "available" && (
                    <Button 
                      size="sm" 
                      className="shrink-0"
                      onClick={() => navigate(`/dashboard/foundation/lesson-plan/${module.id}`)}
                    >
                      Start
                    </Button>
                  )}
                  {module.status === "in-progress" && (
                    <Button 
                      size="sm" 
                      className="shrink-0"
                      onClick={() => navigate(`/dashboard/foundation/lesson-plan/${module.id}`)}
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Detail Modal */}
      {selectedModule && (
        <Card className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-lg bg-card border-border shadow-2xl z-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <selectedModule.icon className="w-5 h-5 text-primary" />
                {selectedModule.title}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedModule(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{selectedModule.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <Badge className={getLevelColor(selectedModule.level)}>
                {selectedModule.level}
              </Badge>
              <span>{selectedModule.lessons} lessons</span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                {selectedModule.xpReward} XP
              </span>
            </div>
            {selectedModule.status !== "completed" && (
              <Button 
                className="w-full btn-primary"
                onClick={() => navigate(`/dashboard/foundation/lesson-plan/${selectedModule.id}`)}
              >
                {selectedModule.status === "in-progress" ? "Continue Learning" : "Start Module"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModuleMap;
