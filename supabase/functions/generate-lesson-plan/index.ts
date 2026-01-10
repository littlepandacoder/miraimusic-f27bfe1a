import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, level, duration, instruments, objectives } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert music teacher and curriculum designer. Create detailed, professional lesson plans for music education.

Your lesson plans should be comprehensive and include:
1. Clear learning objectives
2. Warm-up activities
3. Main lesson content with step-by-step instructions
4. Practice exercises
5. Assessment criteria
6. Homework/practice assignments
7. Tips for common challenges
8. Adaptations for different skill levels

Format your response in well-structured markdown with clear headings and bullet points.`;

    const userPrompt = `Create a detailed music lesson plan with the following parameters:

**Topic:** ${topic}
**Student Level:** ${level || "Beginner"}
**Lesson Duration:** ${duration || "45 minutes"}
${instruments ? `**Instruments:** ${instruments}` : ""}
${objectives ? `**Specific Objectives:** ${objectives}` : ""}

Please create a complete, ready-to-use lesson plan that a music teacher can follow directly.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const lessonPlan = data.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ lessonPlan }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate lesson plan" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
