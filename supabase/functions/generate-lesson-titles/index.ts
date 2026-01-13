import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mapTitle, moduleTitle } = await req.json();
    if (!moduleTitle || !mapTitle) {
      return new Response(JSON.stringify({ error: 'moduleTitle and mapTitle are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // If LOVABLE_API_KEY present, call Lovable AI gateway for better suggestions.
    if (LOVABLE_API_KEY) {
      const systemPrompt = `You are an expert curriculum designer for music lessons. Produce 4 concise lesson titles for the module "${moduleTitle}" within the gamified map "${mapTitle}". Keep each title short (under 8 words) and pedagogically sequenced.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages: [{ role: 'system', content: systemPrompt }], max_tokens: 400 }),
      });

      if (!response.ok) {
        console.warn('Lovable AI returned', response.status);
      } else {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        // Simple split by newline bullets
        const lines = text.split(/\r?\n/).map(l => l.replace(/^[-*\d\.\)\s]+/, '').trim()).filter(Boolean);
        if (lines.length > 0) {
          return new Response(JSON.stringify({ suggestions: lines }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    // Fallback stub suggestions
    const stub = [
      `${moduleTitle} — Intro`,
      `${moduleTitle} — Practice`,
      `${moduleTitle} — Technique`,
      `${moduleTitle} — Assessment`,
    ];

    return new Response(JSON.stringify({ suggestions: stub }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('generate-lesson-titles error', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
