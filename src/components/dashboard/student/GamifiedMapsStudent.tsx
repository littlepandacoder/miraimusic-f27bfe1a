import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import trackEvent from "@/lib/telemetry";

interface Lesson {
  id: string;
  title: string;
  duration: number;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface GamifiedMap {
  id: string;
  title: string;
  description?: string;
  modules?: Module[];
}

const GamifiedMapsStudent = () => {
  const [maps, setMaps] = useState<GamifiedMap[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("gamified_maps")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: true });

        if (error) {
          console.debug("Could not load published gamified maps:", error.message || error);
          setMaps([]);
          return;
        }

        if (data && mounted) {
          setMaps((data as any[]).map(d => ({ id: d.id, title: d.title, description: d.description || "", modules: d.modules || [] })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Loading gamified maps…</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gamified Maps</h2>
      {maps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No gamified maps are published yet. Check back later.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {maps.map(m => (
            <Card key={m.id} className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{m.description}</p>
                <div className="space-y-2">
                  {(m.modules || []).map(mod => (
                    <div key={mod.id} className="p-3 bg-muted/20 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{mod.title}</p>
                          <p className="text-xs text-muted-foreground">{mod.lessons?.length || 0} lessons</p>
                        </div>
                        <div>
                          <Button size="sm" onClick={() => { trackEvent('lesson_start_click', { lessonId: mod.lessons?.[0]?.id, moduleId: mod.id }); navigate(`/dashboard/foundation/lesson-viewer/${mod.id}/${mod.lessons?.[0]?.id || ""}`); }}>
                            Start
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        {(mod.lessons || []).map(ls => (
                          <div key={ls.id} className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm">{ls.title}</p>
                              <p className="text-xs text-muted-foreground">{ls.duration} min</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => { trackEvent('lesson_view_click', { lessonId: ls.id, moduleId: mod.id }); navigate(`/dashboard/foundation/lesson-viewer/${mod.id}/${ls.id}`); }}>
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GamifiedMapsStudent;
