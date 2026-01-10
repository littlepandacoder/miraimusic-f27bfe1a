import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AILessonGenerator = () => {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [duration, setDuration] = useState("45");
  const [instruments, setInstruments] = useState("");
  const [objectives, setObjectives] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateLessonPlan = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a lesson topic.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedPlan("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson-plan", {
        body: {
          topic,
          level,
          duration: `${duration} minutes`,
          instruments: instruments || undefined,
          objectives: objectives || undefined,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedPlan(data.lessonPlan);
      toast({
        title: "Lesson plan generated!",
        description: "Your AI-generated lesson plan is ready.",
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate lesson plan",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedPlan);
    setCopied(true);
    toast({ title: "Copied!", description: "Lesson plan copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Lesson Plan Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lesson Topic *</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Major and Minor Scales, Rhythm Reading, Chord Progressions"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Student Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="elementary">Elementary</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lesson Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Instruments (optional)</Label>
              <Input
                value={instruments}
                onChange={(e) => setInstruments(e.target.value)}
                placeholder="e.g., Piano, Guitar, Voice"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specific Objectives (optional)</Label>
            <Textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Any specific goals or topics you want the lesson to cover..."
              className="bg-secondary border-border min-h-20"
            />
          </div>

          <Button
            onClick={generateLessonPlan}
            disabled={isGenerating}
            className="w-full btn-primary"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Lesson Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Lesson Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedPlan && (
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Generated Lesson Plan</CardTitle>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <div
                className="whitespace-pre-wrap text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: generatedPlan
                    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">$1</h1>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                    .replace(/^\* (.*$)/gim, '<li class="ml-4 text-muted-foreground">$1</li>')
                    .replace(/^- (.*$)/gim, '<li class="ml-4 text-muted-foreground">$1</li>')
                    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-muted-foreground list-decimal">$1</li>')
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AILessonGenerator;
