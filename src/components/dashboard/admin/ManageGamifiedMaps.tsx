import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  duration: number;
}

interface Module {
  id: string;
  title: string;
  level?: string;
  xpReward?: number;
  lessons: Lesson[];
}

interface GamifiedMap {
  id: string;
  title: string;
  description?: string;
  modules?: Module[];
  published?: boolean;
}

const defaultModule = (title = "New Module"): Module => ({ id: `m-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, title, level: 'beginner', xpReward: 100, lessons: [] });

const ManageGamifiedMaps = () => {
  const [maps, setMaps] = useState<GamifiedMap[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GamifiedMap | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  // UI state for expanded map -> modules
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

  // Module dialog state
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");

  // Lesson dialog state
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [currentMapIdForLesson, setCurrentMapIdForLesson] = useState<string | null>(null);
  const [currentModuleIdForLesson, setCurrentModuleIdForLesson] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("20");

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Attempt to load from DB, fallback to empty
    (async () => {
      try {
        const { data, error } = await (supabase as any).from("gamified_maps").select("*");
        if (error) {
          console.debug("gamified_maps table not available or fetch error", error.message || error);
          return;
        }
        if (data) {
          setMaps((data as any[]).map(d => ({ id: d.id, title: d.title, description: d.description || "", modules: d.modules || [], published: !!d.published })));
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const openNew = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setIsDialogOpen(true);
  };

  const save = async () => {
    if (!title.trim()) return;
    if (editing) {
      setMaps(maps.map(m => m.id === editing.id ? { ...m, title, description } : m));
      try {
        const { error } = await (supabase as any).from("gamified_maps").update({ title, description }).eq("id", editing.id);
        if (error) console.debug("Update gamified_map failed", error.message || error);
        else toast({ title: "Updated", description: "Gamified map updated" });
      } catch (err) { console.error(err); }
    } else {
      const newMap: GamifiedMap = { id: `gm-${Date.now()}`, title, description, modules: [] };
      setMaps([...maps, newMap]);
      try {
        const { data, error } = await (supabase as any).from("gamified_maps").insert({ title, description, modules: [], published: false });
        if (error) console.debug("Insert gamified_map failed", error.message || error);
        else toast({ title: "Created", description: "Gamified map created" });
      } catch (err) { console.error(err); }
    }
    setIsDialogOpen(false);
  };

  const togglePublish = async (mapId: string, publish: boolean) => {
    setMaps(prev => prev.map(m => m.id === mapId ? { ...m, published: publish } : m));
    try {
      // If publishing, ensure corresponding foundation modules/lessons exist
      if (publish) {
        const map = maps.find(m => m.id === mapId);
        if (map && map.modules && map.modules.length > 0) {
          // We'll attempt to create foundation modules for any module that doesn't already have a foundation id
          const updatedModules = await Promise.all((map.modules || []).map(async (mod) => {
            // If module already has a foundation_module_id saved in the module object, skip
            // (we don't have a strict shape, so check for foundation_module_id)
            const asAny: any = mod as any;
            if (asAny.foundation_module_id) return mod;

            try {
              const suggested = generateAISuggestions(map.title, mod.title);
              const { data: moduleData, error: modErr } = await (supabase as any).from('modules').insert({
                title: mod.title,
                description: `${mod.title} for ${map.title}`,
                level: (mod as any).level || 'beginner',
                status: 'available',
                xp_reward: (mod as any).xpReward || 100,
                created_by: null,
              }).select().single();

              if (modErr) {
                console.debug('Could not create foundation module for', mod.title, modErr.message || modErr);
                return mod;
              }

              if (moduleData) {
                const lessonsToInsert = (mod.lessons || []).length > 0
                  ? (mod.lessons || []).map((l, idx) => ({ module_id: moduleData.id, title: l.title, duration_minutes: l.duration || 15, status: 'available', order: idx }))
                  : suggested.map((s: string, idx: number) => ({ module_id: moduleData.id, title: s, duration_minutes: 15, status: 'available', order: idx }));

                const { error: lessonsErr } = await (supabase as any).from('module_lessons').insert(lessonsToInsert);
                if (lessonsErr) console.debug('Could not insert suggested lessons for', mod.title, lessonsErr.message || lessonsErr);

                // annotate module locally with foundation id so future publishes skip
                return { ...mod, foundation_module_id: moduleData.id } as Module & { foundation_module_id?: string };
              }
            } catch (err) {
              console.error('Error creating foundation module from gamified map for module', mod.title, err);
            }

            return mod;
          }));

          // Persist updated modules array (with foundation ids) back to gamified_maps
          const { error: persistErr } = await (supabase as any).from('gamified_maps').update({ modules: updatedModules }).eq('id', mapId);
          if (persistErr) console.debug('Could not persist updated modules after publish:', persistErr.message || persistErr);
          // update local state
          setMaps(prev => prev.map(m => m.id === mapId ? { ...m, modules: updatedModules } : m));
        }
      }

      const { error } = await (supabase as any).from('gamified_maps').update({ published: publish }).eq('id', mapId);
      if (error) console.debug('Could not update published flag:', error.message || error);
      else toast({ title: publish ? 'Published' : 'Unpublished', description: `Map ${publish ? 'published' : 'unpublished'}` });
    } catch (err) { console.error(err); }
  };

  const remove = async (id: string) => {
    setMaps(maps.filter(m => m.id !== id));
    try {
      const { error } = await (supabase as any).from("gamified_maps").delete().eq("id", id);
      if (error) console.debug("Delete gamified_map failed", error.message || error);
      else toast({ title: "Deleted" });
    } catch (err) { console.error(err); }
  };

  // Module CRUD within a map
  const addModuleToMap = async (mapId: string, mod?: Module) => {
    const map = maps.find(m => m.id === mapId);
    if (!map) return;
    const moduleObj = mod || defaultModule(`Module ${map.modules?.length? map.modules.length + 1 : 1}`);
    const updated = maps.map(m => m.id === mapId ? { ...m, modules: [...(m.modules || []), moduleObj] } : m);
    setMaps(updated);
    // Persist to gamified_maps table if available
    try {
      const { error } = await (supabase as any).from("gamified_maps").update({ modules: updated.find(x => x.id === mapId)?.modules }).eq("id", mapId);
      if (error) console.debug("Could not persist modules on gamified_map:", error.message || error);
    } catch (err) { console.error(err); }

    // Also attempt to create a foundation module (modules table) so the Foundation UI picks it up
    try {
      const map = updated.find(x => x.id === mapId)!;
      // generate initial lessons based on map + module name via AI stub
      const suggested = generateAISuggestions(map.title, moduleObj.title);
      const { data: moduleData, error: modErr } = await (supabase as any).from("modules").insert({
        title: moduleObj.title,
        description: `${moduleObj.title} for ${map.title}`,
        level: moduleObj.level || 'beginner',
        status: 'available',
        xp_reward: moduleObj.xpReward || 100,
        created_by: null,
      }).select().single();

      if (modErr) {
        console.debug('Could not create foundation module for gamified map:', modErr.message || modErr);
      } else if (moduleData) {
        // create module_lessons for each suggestion
        const lessonsToInsert = suggested.map((s: string, idx: number) => ({
          module_id: moduleData.id,
          title: s,
          duration_minutes: 15,
          status: 'available',
          order: idx,
        }));
        const { error: lessonsErr } = await (supabase as any).from('module_lessons').insert(lessonsToInsert);
        if (lessonsErr) console.debug('Could not insert suggested lessons:', lessonsErr.message || lessonsErr);
        else toast({ title: 'Module created', description: `Foundation module & lessons created for ${moduleObj.title}` });
      }
    } catch (err) {
      console.error('Error creating foundation module from gamified map:', err);
    }
  };

  const updateModuleOnMap = async (mapId: string, moduleId: string, patch: Partial<Module>) => {
    const updated = maps.map(m => {
      if (m.id !== mapId) return m;
      return { ...m, modules: (m.modules || []).map(md => md.id === moduleId ? { ...md, ...patch } : md) };
    });
    setMaps(updated);
    try {
      const { error } = await (supabase as any).from("gamified_maps").update({ modules: updated.find(x => x.id === mapId)?.modules }).eq("id", mapId);
      if (error) console.debug("Could not persist module update:", error.message || error);
    } catch (err) { console.error(err); }
  };

  const deleteModuleFromMap = async (mapId: string, moduleId: string) => {
    const updated = maps.map(m => m.id === mapId ? { ...m, modules: (m.modules || []).filter(md => md.id !== moduleId) } : m);
    setMaps(updated);
    try {
      const { error } = await (supabase as any).from("gamified_maps").update({ modules: updated.find(x => x.id === mapId)?.modules }).eq("id", mapId);
      if (error) console.debug("Could not persist module delete:", error.message || error);
    } catch (err) { console.error(err); }
  };

  // Lesson CRUD within a module
  const addLessonToModule = async (mapId: string, moduleId: string, lesson?: Lesson) => {
    const map = maps.find(m => m.id === mapId);
    if (!map) return;
    const mod = (map.modules || []).find(md => md.id === moduleId);
    if (!mod) return;
    const newLesson: Lesson = lesson || { id: `l-${Date.now()}`, title: lessonTitle || `${map.title} - ${mod.title} Lesson ${mod.lessons.length + 1}`, duration: parseInt(lessonDuration) || 20 };
    const updated = maps.map(m => {
      if (m.id !== mapId) return m;
      return { ...m, modules: (m.modules || []).map(md => md.id === moduleId ? { ...md, lessons: [...md.lessons, newLesson] } : md) };
    });
    setMaps(updated);
    // persist
    try {
      const { error } = await (supabase as any).from("gamified_maps").update({ modules: updated.find(x => x.id === mapId)?.modules }).eq("id", mapId);
      if (error) console.debug("Could not persist lesson add:", error.message || error);
      else toast({ title: "Lesson added" });
    } catch (err) { console.error(err); }
  };

  const deleteLessonFromModule = async (mapId: string, moduleId: string, lessonId: string) => {
    const updated = maps.map(m => {
      if (m.id !== mapId) return m;
      return { ...m, modules: (m.modules || []).map(md => md.id === moduleId ? { ...md, lessons: md.lessons.filter(l => l.id !== lessonId) } : md) };
    });
    setMaps(updated);
    try {
      const { error } = await (supabase as any).from("gamified_maps").update({ modules: updated.find(x => x.id === mapId)?.modules }).eq("id", mapId);
      if (error) console.debug("Could not persist lesson delete:", error.message || error);
    } catch (err) { console.error(err); }
  };

  // Simple AI suggestions (local stub)
  const generateAISuggestions = (mapTitle: string, moduleTitle: string) => {
    const base = `${moduleTitle}`;
    return [
      `${base} — Intro to ${mapTitle}`,
      `${base} — Guided Practice for ${mapTitle}`,
      `${base} — Assessment: ${mapTitle} Basics`,
    ];
  };

  const handleGenerateAIForModule = (mapId: string, moduleId: string) => {
    const map = maps.find(m => m.id === mapId);
    const mod = map?.modules?.find(md => md.id === moduleId);
    if (!map || !mod) return;

    (async () => {
      try {
        // Prefer calling the Supabase Edge Function if available
        if ((supabase as any).functions) {
          const invokeRes = await (supabase as any).functions.invoke('generate-lesson-titles', {
            body: JSON.stringify({ mapTitle: map.title, moduleTitle: mod.title }),
          });
          if (invokeRes && invokeRes.data) {
            const suggestions = (invokeRes.data as any).suggestions || (invokeRes.data as any).choices || [];
            if (Array.isArray(suggestions) && suggestions.length > 0) {
              setAiSuggestions(suggestions);
              return;
            }
          }
        }
      } catch (err) {
        console.debug('AI function call failed, falling back to local stub', err);
      }

      // Fallback to local stub
      const suggestions = generateAISuggestions(map.title, mod.title);
      setAiSuggestions(suggestions);
    })();
  };

  const applyAISuggestions = (mapId: string, moduleId: string) => {
    aiSuggestions.forEach(s => addLessonToModule(mapId, moduleId, { id: `l-${Date.now()}-${Math.random().toString(36).slice(2,5)}`, title: s, duration: 15 }));
    setAiSuggestions([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Gamified Maps</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4"/>Create Map</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Gamified Map" : "Create Gamified Map"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={save}>{editing ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {maps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No gamified maps yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maps.map(m => (
              <Card key={m.id} className="bg-card border-border">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-lg">{m.title}</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(m); setTitle(m.title); setDescription(m.description || ""); setIsDialogOpen(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant={m.published ? 'outline' : 'secondary'} onClick={() => togglePublish(m.id, !m.published)}>
                        {m.published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(m.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                  <div className="mt-4">
                    <Button size="sm" variant="outline" onClick={() => setExpandedMapId(expandedMapId === m.id ? null : m.id)}>
                      {expandedMapId === m.id ? 'Hide Modules' : 'Manage Modules'}
                    </Button>
                    <Button size="sm" className="ml-2" onClick={() => { const newMod = defaultModule(`${m.title} Module`); addModuleToMap(m.id, newMod); setExpandedMapId(m.id); }}>
                      Add Module
                    </Button>
                  </div>

                  {expandedMapId === m.id && (
                    <div className="mt-4 space-y-3">
                      {(m.modules || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No modules yet for this map.</p>
                      ) : (
                        (m.modules || []).map(mod => (
                          <div key={mod.id} className="p-3 bg-muted/30 rounded">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{mod.title}</p>
                                <p className="text-xs text-muted-foreground">{mod.lessons.length} lessons</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setEditingModule(mod); setModuleTitle(mod.title); setIsModuleDialogOpen(true); }}>Edit Module</Button>
                                <Button size="sm" variant="ghost" onClick={() => { setCurrentMapIdForLesson(m.id); setCurrentModuleIdForLesson(mod.id); setIsLessonDialogOpen(true); }}>Add Lesson</Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteModuleFromMap(m.id, mod.id)}>Delete Module</Button>
                                <Button size="sm" variant="outline" onClick={() => handleGenerateAIForModule(m.id, mod.id)}>AI Assist</Button>
                              </div>
                            </div>

                            <div className="mt-2 space-y-2">
                              {mod.lessons.map(les => (
                                <div key={les.id} className="flex items-center justify-between bg-background/50 p-2 rounded">
                                  <div>
                                    <p className="text-sm">{les.title}</p>
                                    <p className="text-xs text-muted-foreground">{les.duration} min</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => deleteLessonFromModule(m.id, mod.id, les.id)}>Delete</Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Module Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Edit Module' : 'Add Module'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold">Module Title</label>
              <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!editingModule) return;
              // update module title in maps
              setMaps(prev => prev.map(map => ({ ...map, modules: (map.modules || []).map(md => md.id === editingModule.id ? { ...md, title: moduleTitle } : md) })));
              // persist
              (async () => {
                try {
                  const mapContaining = maps.find(mp => (mp.modules || []).some(md => md.id === editingModule.id));
                  if (mapContaining) {
                    const { error } = await (supabase as any).from('gamified_maps').update({ modules: mapContaining.modules }).eq('id', mapContaining.id);
                    if (error) console.debug('Persist module title failed', error.message || error);
                  }
                } catch (err) { console.error(err); }
              })();
              setIsModuleDialogOpen(false);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold">Lesson Title</label>
              <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Lesson title" />
            </div>
            <div>
              <label className="text-sm font-semibold">Duration (minutes)</label>
              <Input value={lessonDuration} onChange={(e) => setLessonDuration(e.target.value)} type="number" />
            </div>
            {aiSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">AI Suggestions</p>
                {aiSuggestions.map(s => (
                  <div key={s} className="flex items-center justify-between bg-muted/20 p-2 rounded">
                    <div>{s}</div>
                    <Button size="sm" onClick={() => addLessonToModule(currentMapIdForLesson!, currentModuleIdForLesson!, { id: `l-${Date.now()}`, title: s, duration: 15 })}>Add</Button>
                  </div>
                ))}
                <Button className="mt-2" onClick={() => applyAISuggestions(currentMapIdForLesson!, currentModuleIdForLesson!)}>Add All</Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsLessonDialogOpen(false); setAiSuggestions([]); }}>Cancel</Button>
            <Button onClick={() => {
              if (!currentMapIdForLesson || !currentModuleIdForLesson) return;
              addLessonToModule(currentMapIdForLesson, currentModuleIdForLesson);
              setLessonTitle(""); setLessonDuration("20"); setIsLessonDialogOpen(false);
            }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ManageGamifiedMaps;
