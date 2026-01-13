import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GamifiedMap {
  id: string;
  title: string;
  description?: string;
  modules?: string[]; // module ids
}

const ManageGamifiedMaps = () => {
  const [maps, setMaps] = useState<GamifiedMap[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GamifiedMap | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

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
          setMaps((data as any[]).map(d => ({ id: d.id, title: d.title, description: d.description || "", modules: d.modules || [] })));
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
        const { data, error } = await (supabase as any).from("gamified_maps").insert({ title, description, modules: [] });
        if (error) console.debug("Insert gamified_map failed", error.message || error);
        else toast({ title: "Created", description: "Gamified map created" });
      } catch (err) { console.error(err); }
    }
    setIsDialogOpen(false);
  };

  const remove = async (id: string) => {
    setMaps(maps.filter(m => m.id !== id));
    try {
      const { error } = await (supabase as any).from("gamified_maps").delete().eq("id", id);
      if (error) console.debug("Delete gamified_map failed", error.message || error);
      else toast({ title: "Deleted" });
    } catch (err) { console.error(err); }
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
                    <Button size="sm" variant="destructive" onClick={() => remove(m.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageGamifiedMaps;
