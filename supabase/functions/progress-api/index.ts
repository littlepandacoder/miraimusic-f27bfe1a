import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const accessToken = authHeader.split(" ")[1];

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller
    const { data: userResult, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userResult?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const callerId = userResult.user.id;

    const { action, data } = await req.json();

    // Helper: ensure module totals are recalculated live
    async function getModuleTotals() {
      const { data: counts } = await supabaseAdmin
        .from('foundation_lessons')
        .select('module_id, count:count(1)', { count: 'exact' })
        .group('module_id');

      const map: Record<string, number> = {};
      if (Array.isArray(counts)) {
        for (const row of counts as any[]) {
          map[row.module_id] = parseInt(row.count || 0);
        }
      }
      return map;
    }

    // initializeUserProgress -> sets all modules for the user to 0
    if (action === 'initializeUserProgress') {
      const userId = data.userId || callerId;

      // fetch all modules and their lesson counts
      const { data: modules } = await supabaseAdmin.from('foundation_modules').select('id');
      const totals = await getModuleTotals();

      const rows = (modules || []).map((m: any) => ({
        student_id: userId,
        module_id: m.id,
        completed_lessons: 0,
        progress_percent: 0,
        status: 'not_started',
        last_updated: new Date().toISOString(),
      }));

      const { error } = await supabaseAdmin.from('student_foundation_progress').upsert(rows, { onConflict: ['student_id', 'module_id'] });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // completeLesson -> marks lesson completed and recalculates module progress
    if (action === 'completeLesson') {
      const userId = data.userId || callerId;
      const lessonId = data.lessonId;
      if (!lessonId) return new Response(JSON.stringify({ error: 'lessonId required' }), { status: 400, headers: corsHeaders });

      // Get the lesson to determine module
      const { data: lessonRow, error: lessonErr } = await supabaseAdmin.from('foundation_lessons').select('id, module_id').eq('id', lessonId).single();
      if (lessonErr || !lessonRow) throw lessonErr || new Error('Lesson not found');
      const moduleId = lessonRow.module_id;

      // Insert or update student's lesson progress (idempotent)
      const { data: existing, error: existingErr } = await supabaseAdmin
        .from('student_lesson_progress')
        .select('*')
        .eq('student_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      if (existingErr && existingErr.code !== 'PGRST116') {
        // ignore not found error represetations, but throw other errors
      }

      if (!existing || !existing.completed) {
        const { error: upsertErr } = await supabaseAdmin.from('student_lesson_progress').upsert({
          student_id: userId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: ['student_id', 'lesson_id'] });

        if (upsertErr) throw upsertErr;
      }

      // Recalculate completed lessons for the module
      const { data: completedRows } = await supabaseAdmin
        .from('student_lesson_progress')
        .select('lesson_id')
        .in('lesson_id', (await supabaseAdmin.from('foundation_lessons').select('id').eq('module_id', moduleId)).data!.map((r: any) => r.id))
        .eq('student_id', userId)
        .eq('completed', true);

      const completedCount = (completedRows || []).length;

      // Total lessons in module
      const { data: totalRows } = await supabaseAdmin.from('foundation_lessons').select('id').eq('module_id', moduleId);
      const total = (totalRows || []).length || 0;

      const progressPercent = total === 0 ? 0 : Math.min(100, Math.round((completedCount / total) * 100));
      const status = completedCount === 0 ? 'not_started' : (completedCount >= total ? 'completed' : 'in_progress');

      const { error: upsertProgErr } = await supabaseAdmin.from('student_foundation_progress').upsert({
        student_id: userId,
        module_id: moduleId,
        completed_lessons: completedCount,
        progress_percent: progressPercent,
        status,
        last_updated: new Date().toISOString(),
      }, { onConflict: ['student_id', 'module_id'] });

      if (upsertProgErr) throw upsertProgErr;

      return new Response(JSON.stringify({ success: true, moduleId, completedCount, total, progressPercent, status }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // getStudentDashboard -> returns all modules with progress for a user
    if (action === 'getStudentDashboard') {
      const userId = data.userId || callerId;

      // fetch modules
      const { data: modules } = await supabaseAdmin.from('foundation_modules').select('id, title, xp_reward');

      // fetch totals per module
      const { data: lessonCounts } = await supabaseAdmin.from('foundation_lessons').select('module_id, count:count(1)', { count: 'exact' }).group('module_id');
      const totalsMap: Record<string, number> = {};
      (lessonCounts || []).forEach((r: any) => { totalsMap[r.module_id] = parseInt(r.count || 0); });

      // fetch user progress and completed lessons
      const { data: progresses } = await supabaseAdmin.from('student_foundation_progress').select('*').eq('student_id', userId);
      const progressMap: Record<string, any> = {};
      (progresses || []).forEach((p: any) => { progressMap[p.module_id] = p; });

      // Compose response
      const modulesResp = (modules || []).map((m: any) => {
        const totalLessons = totalsMap[m.id] || 0;
        const prog = progressMap[m.id];
        const completedLessons = prog ? prog.completed_lessons : 0;
        let progressPercent = prog ? parseInt(prog.progress_percent) : 0;
        // Recalculate if totals changed
        if (totalLessons > 0) {
          const recomputed = Math.min(100, Math.round((completedLessons / totalLessons) * 100));
          if (recomputed !== progressPercent) {
            // update stored progress row to keep data consistent
            await supabaseAdmin.from('student_foundation_progress').upsert({
              student_id: userId,
              module_id: m.id,
              completed_lessons: completedLessons,
              progress_percent: recomputed,
              status: completedLessons === 0 ? 'not_started' : (completedLessons >= totalLessons ? 'completed' : 'in_progress'),
              last_updated: new Date().toISOString(),
            }, { onConflict: ['student_id', 'module_id'] });
            progressPercent = recomputed;
          }
        } else {
          progressPercent = 0;
        }

        return {
          moduleId: m.id,
          title: m.title,
          xpReward: m.xp_reward || 0,
          totalLessons,
          completedLessons,
          progressPercent,
          status: prog ? prog.status : 'not_started'
        };
      });

      return new Response(JSON.stringify({ success: true, modules: modulesResp }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});