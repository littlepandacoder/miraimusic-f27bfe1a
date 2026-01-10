import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AITutorProps {
  lessonContext?: {
    title: string;
    description: string | null;
  };
}

const AITutor = ({ lessonContext }: AITutorProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      toast({
        title: "Connected!",
        description: "You can now speak with your AI music tutor.",
      });
    },
    onDisconnect: () => {
      toast({
        title: "Disconnected",
        description: "Your session with the AI tutor has ended.",
      });
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to AI tutor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (error) throw error;

      if (!data?.token) {
        throw new Error("No token received");
      }

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Failed to start",
        description: error instanceof Error ? error.message : "Could not start AI tutor session.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleMute = useCallback(async () => {
    if (isMuted) {
      await conversation.setVolume({ volume: 1 });
    } else {
      await conversation.setVolume({ volume: 0 });
    }
    setIsMuted(!isMuted);
  }, [conversation, isMuted]);

  const isConnected = conversation.status === "connected";

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          AI Music Tutor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {lessonContext && (
          <div className="bg-secondary/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Current Lesson:</p>
            <p className="font-medium">{lessonContext.title}</p>
            {lessonContext.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {lessonContext.description}
              </p>
            )}
          </div>
        )}

        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                isConnected
                  ? conversation.isSpeaking
                    ? "bg-primary animate-pulse"
                    : "bg-primary/70"
                  : "bg-secondary"
              }`}
            >
              {isConnected ? (
                conversation.isSpeaking ? (
                  <Volume2 className="w-12 h-12 text-primary-foreground" />
                ) : (
                  <Mic className="w-12 h-12 text-primary-foreground" />
                )
              ) : (
                <MicOff className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {isConnected
              ? conversation.isSpeaking
                ? "AI Tutor is speaking..."
                : "Listening... Ask your question!"
              : "Click Start to begin your session"}
          </p>

          <div className="flex justify-center gap-4">
            {!isConnected ? (
              <Button
                onClick={startConversation}
                disabled={isConnecting}
                className="btn-primary px-8"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Session
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  size="icon"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  onClick={stopConversation}
                  variant="destructive"
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  End Session
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="bg-secondary/30 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Tips for your session:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Ask about music theory concepts</li>
            <li>• Get help with practice techniques</li>
            <li>• Learn about your instrument</li>
            <li>• Understand rhythm and timing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AITutor;
