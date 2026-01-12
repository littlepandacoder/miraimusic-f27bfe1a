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

    const { data: userResult, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userResult?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const callerId = userResult.user.id;

    // ensure caller has teacher or admin role
    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .in("role", ["teacher", "admin"])
      .limit(1)
      .single();

    if (roleError || !roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const payload = await req.json();

    // expected payload: { itemType: 'module' | 'lesson', action: 'create'|'update'|'delete', data: {...} }
    const { itemType, action, data } = payload;

    if (itemType === 'module') {
      if (action === 'create') {
        const { data: res, error } = await supabaseAdmin
          .from('foundation_modules')
          .insert([{
            title: data.title,
            description: data.description || null,
            level: data.level || 'beginner',
            xp_reward: data.xpReward || 0,
          }])
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, module: res }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (action === 'update') {
        const { id } = data;
        const { error } = await supabaseAdmin
          .from('foundation_modules')
          .update({
            title: data.title,
            description: data.description || null,
            level: data.level || 'beginner',
            xp_reward: data.xpReward || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (action === 'delete') {
        const { id } = data;
        const { error } = await supabaseAdmin.from('foundation_modules').delete().eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (itemType === 'lesson') {
      if (action === 'create') {
        // set created_by to the caller so we know which teacher/admin created it
        const { data: res, error } = await supabaseAdmin
          .from('foundation_lessons')
          .insert([{
            module_id: data.moduleId,
            title: data.title,
            description: data.description || null,
            duration_minutes: data.duration || 20,
            content: data.content || {},
            created_by: callerId,
            is_published: data.isPublished === true,
          }])
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, lesson: res }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (action === 'update') {
        const { id } = data;
        const payload: any = {
          title: data.title,
          description: data.description || null,
          duration_minutes: data.duration || 20,
          content: data.content || {},
          updated_at: new Date().toISOString(),
        };
        if (typeof data.isPublished !== 'undefined') payload.is_published = data.isPublished;

        const { error } = await supabaseAdmin
          .from('foundation_lessons')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (action === 'delete') {
        const { id } = data;
        const { error } = await supabaseAdmin.from('foundation_lessons').delete().eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400, headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});