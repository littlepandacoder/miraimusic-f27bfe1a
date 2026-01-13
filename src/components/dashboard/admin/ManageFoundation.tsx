import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Music, 
  Piano,
  BookOpen,
  Trophy,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  BookOpenText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Lesson {
  id: string;
  title: string;
  duration: number;
  status: "completed" | "in-progress" | "available" | "locked";
}

interface Module {
  id: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  status: "locked" | "available" | "in-progress" | "completed";
  xpReward: number;
  lessons: Lesson[];
  icon: React.ElementType;
}

const INITIAL_MODULES: Module[] = [
  {
    id: "1",
    title: "Welcome to Piano",
    level: "beginner",
    status: "completed",
    xpReward: 100,
    icon: Piano,
    lessons: [
      { id: "1-1", title: "Introduction to Piano", duration: 15, status: "completed" },
      { id: "1-2", title: "Proper Posture & Seating", duration: 20, status: "completed" },
      { id: "1-3", title: "Hand Position & Technique", duration: 20, status: "completed" },
      { id: "1-4", title: "Warm-up Exercises", duration: 15, status: "completed" },
    ]
  },
  {
    id: "2",
    title: "Reading Notes",
    level: "beginner",
    status: "completed",
    xpReward: 150,
    icon: BookOpen,
    lessons: [
      { id: "2-1", title: "The Musical Staff", duration: 15, status: "completed" },
      { id: "2-2", title: "Treble Clef Notes", duration: 20, status: "completed" },
      { id: "2-3", title: "Bass Clef Notes", duration: 20, status: "completed" },
      { id: "2-4", title: "Ledger Lines", duration: 15, status: "completed" },
      { id: "2-5", title: "Accidentals", duration: 20, status: "completed" },
      { id: "2-6", title: "Note Reading Practice", duration: 25, status: "completed" },
    ]
  },
];

const ManageFoundation = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedModuleForLesson, setSelectedModuleForLesson] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    moduleTitle: "",
    moduleXP: "100",
    moduleLevel: "beginner" as "beginner" | "intermediate" | "advanced",
    lessonTitle: "",
    lessonDuration: "20",
  });
  const { toast } = useToast();

  // Try to load modules from Supabase; if tables don't exist, fall back to local state
  useEffect(() => {
    const loadFromDb = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("modules")
          .select("*, module_lessons(*)")
          .order("created_at", { ascending: true });

        if (error) {
          console.debug("Modules table not available or fetch error:", error.message || error);
          return; // keep using local modules
        }

        if (data) {
          const mapped = (data as any[]).map((m) => ({
            id: m.id,
            title: m.title,
            level: m.level || "beginner",
            status: m.status || "available",
            xpReward: m.xp_reward || 0,
            icon: Music,
            lessons: (m.module_lessons || []).map((l: any) => ({
              id: l.id,
              title: l.title,
              duration: l.duration_minutes || 0,
              status: l.status || "available",
            })),
          }));

          setModules(mapped);
        }
      } catch (err) {
        console.error("Error loading modules:", err);
      }
    };

    loadFromDb();
  }, []);
  const handleAddModule = () => {
    if (!formData.moduleTitle.trim()) return;
    
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: formData.moduleTitle,
      level: formData.moduleLevel,
      status: "available",
      xpReward: parseInt(formData.moduleXP) || 100,
      icon: Music,
      lessons: [],
    };
    
    setModules([...modules, newModule]);
    // Try to persist to DB
    (async () => {
      try {
        const { data, error } = await (supabase as any).from("modules").insert({
          title: newModule.title,
          description: "",
          level: newModule.level,
          status: newModule.status,
          xp_reward: newModule.xpReward,
          created_by: user?.id || null,
        });
        if (error) {
          console.debug("Create module failed or table missing:", error.message || error);
        } else {
          toast({ title: "Module created", description: "Saved to database." });
        }
      } catch (err) {
        console.error(err);
      }
    })();
    resetModuleForm();
    setIsModuleDialogOpen(false);
  };

  const handleUpdateModule = () => {
    if (!editingModule || !formData.moduleTitle.trim()) return;

    setModules(modules.map(m => 
      m.id === editingModule.id 
        ? { ...m, title: formData.moduleTitle, level: formData.moduleLevel, xpReward: parseInt(formData.moduleXP) || 100 }
        : m
    ));

    // Try to update DB
    (async () => {
      try {
        if (editingModule?.id) {
          const { error } = await (supabase as any).from("modules").update({
            title: formData.moduleTitle,
            level: formData.moduleLevel,
            xp_reward: parseInt(formData.moduleXP) || 100,
            updated_at: new Date().toISOString(),
          }).eq("id", editingModule.id);
          if (error) console.debug("Update module failed:", error.message || error);
        }
      } catch (err) {
        console.error(err);
      }
    })();

    resetModuleForm();
    setEditingModule(null);
    setIsModuleDialogOpen(false);
  };

  const handleDeleteModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
    (async () => {
      try {
        const { error } = await (supabase as any).from("modules").delete().eq("id", id);
        if (error) console.debug("Delete module failed (maybe table missing):", error.message || error);
      } catch (err) {
        console.error(err);
      }
    })();
  };

  // Lesson CRUD (local state only)
  const handleAddLesson = () => {
    if (!formData.lessonTitle.trim() || !selectedModuleForLesson) return;

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: formData.lessonTitle,
      duration: parseInt(formData.lessonDuration) || 20,
      status: "available",
    };

    setModules(modules.map(m => 
      m.id === selectedModuleForLesson 
        ? { ...m, lessons: [...m.lessons, newLesson] }
        : m
    ));

    // Save a preview session locally so editors/previewer can pick up defaults
    try {
      const previewKey = `lesson_preview:${newLesson.id}`;
      const preview = {
        id: newLesson.id,
        title: newLesson.title,
        duration: newLesson.duration,
        moduleId: selectedModuleForLesson,
        notes: "",
        videos: [],
        status: "draft",
      };
      localStorage.setItem(previewKey, JSON.stringify(preview));
    } catch (e) {
      // ignore storage errors
    }

    // Try to persist lesson to DB
    (async () => {
      try {
        const { data, error } = await (supabase as any).from("module_lessons").insert({
          module_id: selectedModuleForLesson,
          title: newLesson.title,
          duration_minutes: newLesson.duration,
          status: newLesson.status,
          "order": 0,
        });
        if (error) console.debug("Insert lesson failed:", error.message || error);
      } catch (err) {
        console.error(err);
      }
    })();

    resetLessonForm();
    setIsLessonDialogOpen(false);
    // Open preview of the newly added lesson
    navigate(`/dashboard/foundation/lesson-viewer/${selectedModuleForLesson}/${newLesson.id}?preview=1`);
  };

  const handleUpdateLesson = () => {
    if (!editingLesson || !selectedModuleForLesson || !formData.lessonTitle.trim()) return;

    setModules(modules.map(m => 
      m.id === selectedModuleForLesson 
        ? { 
            ...m, 
            lessons: m.lessons.map(l => 
              l.id === editingLesson.id 
                ? { ...l, title: formData.lessonTitle, duration: parseInt(formData.lessonDuration) || 20 }
                : l
            )
          }
        : m
    ));

    // Try to update lesson in DB
    (async () => {
      try {
        if (editingLesson?.id) {
          const { error } = await (supabase as any).from("module_lessons").update({
            title: formData.lessonTitle,
            duration_minutes: parseInt(formData.lessonDuration) || 20,
            updated_at: new Date().toISOString(),
          }).eq("id", editingLesson.id);
          if (error) console.debug("Update lesson failed:", error.message || error);
        }
      } catch (err) {
        console.error(err);
      }
    })();

    resetLessonForm();
    setEditingLesson(null);
    setIsLessonDialogOpen(false);
    // Update preview session so editor defaults reflect the latest edits
    try {
      const previewKey = `lesson_preview:${editingLesson?.id}`;
      const preview = {
        id: editingLesson?.id,
        title: formData.lessonTitle,
        duration: parseInt(formData.lessonDuration) || 20,
        moduleId: selectedModuleForLesson,
        notes: "",
        videos: [],
        status: "draft",
      };
      if (editingLesson?.id) localStorage.setItem(previewKey, JSON.stringify(preview));
    } catch (e) {
      // ignore
    }
    // Open preview after updating
    navigate(`/dashboard/foundation/lesson-viewer/${selectedModuleForLesson}/${editingLesson.id}?preview=1`);
  };

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(m => 
      m.id === moduleId 
        ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
        : m
    ));
    (async () => {
      try {
        const { error } = await (supabase as any).from("module_lessons").delete().eq("id", lessonId);
        if (error) console.debug("Delete lesson failed:", error.message || error);
      } catch (err) {
        console.error(err);
      }
    })();
  };

  const resetModuleForm = () => {
    setFormData({
      ...formData,
      moduleTitle: "",
      moduleXP: "100",
      moduleLevel: "beginner",
    });
  };

  const resetLessonForm = () => {
    setFormData({
      ...formData,
      lessonTitle: "",
      lessonDuration: "20",
    });
  };

  const openEditModule = (module: Module) => {
    setEditingModule(module);
    setFormData({
      ...formData,
      moduleTitle: module.title,
      moduleXP: module.xpReward.toString(),
      moduleLevel: module.level,
    });
    setIsModuleDialogOpen(true);
  };

  const openEditLesson = (module: Module, lesson: Lesson) => {
    // Navigate to lesson editor page for full editing
    navigate(`/dashboard/foundation/lesson-editor/${module.id}/${lesson.id}`);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Manage Foundation Modules</h2>
        <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gap-2"
              onClick={() => {
                setEditingModule(null);
                resetModuleForm();
              }}
            >
              <Plus className="w-4 h-4" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingModule ? "Edit Module" : "Add New Module"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Module Title</label>
                <Input
                  value={formData.moduleTitle}
                  onChange={(e) => setFormData({ ...formData, moduleTitle: e.target.value })}
                  placeholder="Enter module title"
                  className="text-lg h-10 mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Level</label>
                <select
                  value={formData.moduleLevel}
                  onChange={(e) => setFormData({ ...formData, moduleLevel: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md text-lg mt-1 bg-background"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">XP Reward</label>
                <Input
                  type="number"
                  value={formData.moduleXP}
                  onChange={(e) => setFormData({ ...formData, moduleXP: e.target.value })}
                  placeholder="Enter XP reward"
                  className="text-lg h-10 mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingModule ? handleUpdateModule : handleAddModule}>
                {editingModule ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info banner */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="py-4">
          <p className="text-sm text-blue-400">
            <strong>Note:</strong> Foundation modules are currently stored locally. Database tables will be created when you run the foundation migration.
          </p>
        </CardContent>
      </Card>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((module) => (
          <Card key={module.id} className="bg-card border-border">
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedModuleId(expandedModuleId === module.id ? null : module.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <button className="p-0 hover:bg-muted rounded">
                    {expandedModuleId === module.id ? (
                      <ChevronUp className="w-6 h-6" />
                    ) : (
                      <ChevronDown className="w-6 h-6" />
                    )}
                  </button>
                  <div>
                    <CardTitle className="text-2xl">{module.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn("text-xs", getLevelColor(module.level))}>
                        {module.level}
                      </Badge>
                      <Badge variant="outline" className="text-xs gap-1">
                        <Trophy className="w-3 h-3 text-yellow-400" />
                        {module.xpReward} XP
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {module.lessons.length} lessons
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModule(module)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Module?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will delete "{module.title}" and all its lessons. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteModule(module.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>

            {/* Expanded Lessons */}
            {expandedModuleId === module.id && (
              <CardContent className="border-t">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Lessons</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Open lesson editor for creating a new lesson
                      navigate(`/dashboard/foundation/lesson-editor/${module.id}/new`);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Lesson
                  </Button>
                </div>

                {module.lessons.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    No lessons yet. Add your first lesson!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {module.lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6">
                            {index + 1}.
                          </span>
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">{lesson.duration} min</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditLesson(module, lesson)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/dashboard/foundation/lesson-viewer/${module.id}/${lesson.id}?preview=1`)}
                          >
                            Preview
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Lesson?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will delete "{lesson.title}". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteLesson(module.id, lesson.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Lesson Title</label>
              <Input
                value={formData.lessonTitle}
                onChange={(e) => setFormData({ ...formData, lessonTitle: e.target.value })}
                placeholder="Enter lesson title"
                className="text-lg h-10 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Duration (minutes)</label>
              <Input
                type="number"
                value={formData.lessonDuration}
                onChange={(e) => setFormData({ ...formData, lessonDuration: e.target.value })}
                placeholder="Enter duration"
                className="text-lg h-10 mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingLesson ? handleUpdateLesson : handleAddLesson}>
              {editingLesson ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageFoundation;
