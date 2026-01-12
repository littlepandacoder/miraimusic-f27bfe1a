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
    // Require an Authorization: Bearer <access_token> header and check that the calling user is an admin.
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const accessToken = authHeader.split(" ")[1];

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify token and ensure the caller has admin role
    const { data: userResult, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userResult?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const callerId = userResult.user.id;

    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .single();

    if (roleError || !roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { email, password, full_name, role } = await req.json();

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // Create profile
    await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      email,
      full_name,
    });

    // Assign role
    await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role,
    });

    // If new user is a student, initialize foundation progress (0%) for all foundation modules
    if (role === "student") {
      // fetch all foundation modules
      const { data: modules, error: modulesError } = await supabaseAdmin
        .from("foundation_modules")
        .select("id");

      if (!modulesError && modules && modules.length > 0) {
        const rows = modules.map((m: any) => ({
          student_id: userId,
          module_id: m.id,
          completed_lessons: 0,
          progress_percent: 0,
        }));

        // upsert to avoid duplicates
        await supabaseAdmin.from("student_foundation_progress").upsert(rows, { onConflict: ["student_id", "module_id"] });
      }
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
