import { Gamepad2, Sparkles, Bot } from "lucide-react";

const GamifiedSection = () => {
  return (
    <section className="py-20 bg-navy-dark/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div>
            <h2 className="section-title text-foreground mb-8">
              GAMIFIED LECTURES WITH AI INTEGRATION
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground mb-1">
                    SAY GOODBYE TO TRADITIONAL BORING CLASSES.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-lime/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-lime" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground mb-1">
                    SAY HELLO TO COOLER WAY OF LEARNING.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-cyan" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground mb-1">
                    GET YOUR ASSESSMENT ON THE GO!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Illustration */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto">
              <div className="w-full h-full rounded-3xl bg-gradient-to-br from-primary/30 via-cyan/20 to-lime/20 flex items-center justify-center relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-10 left-10 w-16 h-16 bg-primary/40 rounded-full animate-float" />
                <div className="absolute bottom-20 right-10 w-12 h-12 bg-lime/40 rounded-full animate-float" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 right-20 w-8 h-8 bg-cyan/40 rounded-full animate-float" style={{ animationDelay: "0.5s" }} />
                
                {/* Central car/gaming icon representation */}
                <div className="relative z-10">
                  <div className="w-48 h-48 bg-card rounded-2xl shadow-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary to-pink-light rounded-xl flex items-center justify-center">
                        <Bot className="w-12 h-12 text-foreground" />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">AI-POWERED</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamifiedSection;
