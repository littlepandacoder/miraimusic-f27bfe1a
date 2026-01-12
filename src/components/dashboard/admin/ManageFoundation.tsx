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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

  // Module CRUD
  const handleAddModule = async () => {
    if (!formData.moduleTitle.trim()) return;

    // Create module in DB via autosave function
    try {
      const res = await fetch('/.netlify/functions/autosave-foundation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'module',
          action: 'create',
          data: {
            title: formData.moduleTitle,
            description: '',
            level: formData.moduleLevel,
            xpReward: parseInt(formData.moduleXP),
          }
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create module');

      // Refresh list from DB
      const { data: modulesData } = await supabase.from('foundation_modules').select('*');
      setModules((modulesData || []).map((m: any) => ({ ...m, lessons: [] })));

      resetModuleForm();
      setIsModuleDialogOpen(false);
    } catch (err) {
      alert('Failed to create module: ' + String(err));
    }
  };

  const handleUpdateModule = async () => {
    if (!editingModule || !formData.moduleTitle.trim()) return;

    try {
      const res = await fetch('/.netlify/functions/autosave-foundation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'module',
          action: 'update',
          data: {
            id: editingModule.id,
            title: formData.moduleTitle,
            level: formData.moduleLevel,
            xpReward: parseInt(formData.moduleXP),
          }
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update module');

      const { data: modulesData } = await supabase.from('foundation_modules').select('*');
      setModules((modulesData || []).map((m: any) => ({ ...m, lessons: [] })));

      resetModuleForm();
      setEditingModule(null);
      setIsModuleDialogOpen(false);
    } catch (err) {
      alert('Failed to update module: ' + String(err));
    }
  };

  const handleDeleteModule = async (id: string) => {
    try {
      const res = await fetch('/.netlify/functions/autosave-foundation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'module', action: 'delete', data: { id } }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete module');

      const { data: modulesData } = await supabase.from('foundation_modules').select('*');
      setModules((modulesData || []).map((m: any) => ({ ...m, lessons: [] })));
    } catch (err) {
      alert('Failed to delete module: ' + String(err));
    }
  };

  // Lesson CRUD
  const handleAddLesson = async () => {
    if (!formData.lessonTitle.trim() || !selectedModuleForLesson) return;

    try {
      const res = await fetch('/.netlify/functions/autosave-foundation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'lesson',
          action: 'create',
          data: {
            moduleId: selectedModuleForLesson,
            title: formData.lessonTitle,
            description: '',
            duration: parseInt(formData.lessonDuration),
          }
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create lesson');

      // Refresh lessons
      const { data: lessonsData } = await supabase.from('foundation_lessons').select('*');
      // Map lessons into modules
      const grouped = (lessonsData || []).reduce((acc: any, l: any) => {
        acc[l.module_id] = acc[l.module_id] || [];
        acc[l.module_id].push(l);
        return acc;
      }, {} as Record<string, any[]>);

      const { data: modulesData } = await supabase.from('foundation_modules').select('*');
      setModules((modulesData || []).map((m: any) => ({ ...m, lessons: (grouped[m.id] || []) })));

      resetLessonForm();
      setIsLessonDialogOpen(false);
    } catch (err) {
      alert('Failed to create lesson: ' + String(err));
    }
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson || !selectedModuleForLesson || !formData.lessonTitle.trim()) return;

    try {
      const res = await fetch('/.netlify/functions/autosave-foundation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'lesson',
          action: 'update',
          data: {
            id: editingLesson.id,
            title: formData.lessonTitle,
            duration: parseInt(formData.lessonDuration),
            description: '',
          }
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update lesson');

      const { data: lessonsData } = await supabase.from('foundation_lessons').select('*');
      const grouped = (lessonsData || []).reduce((acc: any, l: any) => {
        acc[l.module_id] = acc[l.module_id] || [];
        acc[l.module_id].push(l);
        return acc;
      }, {} as Record<string, any[]>);

      const { data: modulesData } = await supabase.from('foundation_modules').select('*');
      setModules((modulesData || []).map((m: any) => ({ ...m, lessons: (grouped[m.id] || []) })));

      resetLessonForm();
      setEditingLesson(null);
      setIsLessonDialogOpen(false);
    } catch (err) {
      alert('Failed to update lesson: ' + String(err));
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    try {
      const res = await fetch('/.netlify/functions/autosave-foundation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'lesson', action: 'delete', data: { id: lessonId } }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete lesson');

      const { data: lessonsData } = await supabase.from('foundation_lessons').select('*');
      const grouped = (lessonsData || []).reduce((acc: any, l: any) => {
        acc[l.module_id] = acc[l.module_id] || [];
        acc[l.module_id].push(l);
        return acc;
      }, {} as Record<string, any[]>);

      const { data: modulesData } = await supabase.from('foundation_modules').select('*');
      setModules((modulesData || []).map((m: any) => ({ ...m, lessons: (grouped[m.id] || []) })));
    } catch (err) {
      alert('Failed to delete lesson: ' + String(err));
    }
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

  // Autosave modules when editing (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (editingModule && formData.moduleTitle.trim()) {
        try {
          await fetch('/.netlify/functions/autosave-foundation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemType: 'module',
              action: 'update',
              data: {
                id: editingModule.id,
                title: formData.moduleTitle,
                level: formData.moduleLevel,
                xpReward: parseInt(formData.moduleXP),
              }
            })
          });
        } catch (err) {
          console.warn('Autosave failed for module:', err);
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.moduleTitle, formData.moduleLevel, formData.moduleXP, editingModule]);

  // Autosave lessons when editing (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (editingLesson && selectedModuleForLesson && formData.lessonTitle.trim()) {
        try {
          await fetch('/.netlify/functions/autosave-foundation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemType: 'lesson',
              action: 'update',
              data: {
                id: editingLesson.id,
                title: formData.lessonTitle,
                duration: parseInt(formData.lessonDuration),
                description: '',
              }
            })
          });
        } catch (err) {
          console.warn('Autosave failed for lesson:', err);
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.lessonTitle, formData.lessonDuration, editingLesson, selectedModuleForLesson]);

  // Load modules from DB on mount
  useEffect(() => {
    async function load() {
      const { data: modulesData } = await supabase.from('foundation_modules').select('*');
      const { data: lessonsData } = await supabase.from('foundation_lessons').select('*');
      const grouped = (lessonsData || []).reduce((acc: any, l: any) => {
        acc[l.module_id] = acc[l.module_id] || [];
        acc[l.module_id].push(l);
        return acc;
      }, {} as Record<string, any[]>);
      setModules((modulesData || []).map((m: any) => ({ ...m, lessons: (grouped[m.id] || []) })));
    }
    load();
  }, []);

  const openEditLesson = (module: Module, lesson: Lesson) => {
    setSelectedModuleForLesson(module.id);
    setEditingLesson(lesson);
    setFormData({
      ...formData,
      lessonTitle: lesson.title,
      lessonDuration: lesson.duration.toString(),
    });
    setIsLessonDialogOpen(true);
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
                  className="w-full px-3 py-2 border rounded-md text-lg mt-1"
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
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className={cn("text-sm", getLevelColor(module.level))}>
                        {module.level}
                      </Badge>
                      <span className="text-lg font-semibold text-yellow-400">
                        {module.xpReward} XP
                      </span>
                      <span className="text-lg text-muted-foreground">
                        {module.lessons.length} lessons
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModule(module);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Module</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{module.title}"? This action cannot be undone.
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

            {/* Lessons List */}
            {expandedModuleId === module.id && (
              <CardContent className="pt-0 border-t">
                <div className="space-y-3 mt-6">
                  {module.lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-muted"
                    >
                      <div>
                        <p className="text-lg font-semibold">{idx + 1}. {lesson.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{lesson.duration} minutes</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/dashboard/foundation/lesson-editor/${module.id}/${lesson.id}`)}
                          className="gap-2"
                        >
                          <BookOpenText className="w-4 h-4" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{lesson.title}"? This action cannot be undone.
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

                  {/* Add Lesson Button */}
                  <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          setSelectedModuleForLesson(module.id);
                          setEditingLesson(null);
                          resetLessonForm();
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Add Lesson
                      </Button>
                    </DialogTrigger>
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
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ManageFoundation;
