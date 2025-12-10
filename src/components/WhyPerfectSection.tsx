import { Music, BookOpen, Zap, Award } from "lucide-react";

const benefits = [
  { icon: Music, text: "STRUGGLE TO READ NOTES?" },
  { icon: BookOpen, text: "ANXIETY DURING SIGHT READING SECTION?" },
  { icon: Zap, text: "DYING TO PICK UP YOUR FAVORITE PIECE WITH EASE?" },
  { icon: Award, text: "WISHING IT TAKES YOU 10 MINUTES OR LESS TO LEARN A PIECE?" },
];

const WhyPerfectSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center text-foreground mb-16">
          WHY IT'S PERFECT FOR YOU.
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Hands illustration */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-primary/20 to-transparent rounded-full flex items-center justify-center">
              <div className="text-center p-8">
                <svg viewBox="0 0 200 200" className="w-full h-full max-w-xs mx-auto">
                  {/* Piano hands illustration */}
                  <ellipse cx="100" cy="120" rx="80" ry="60" fill="hsl(var(--pink) / 0.3)" />
                  <ellipse cx="100" cy="110" rx="60" ry="45" fill="hsl(var(--pink) / 0.5)" />
                  <rect x="40" y="140" width="120" height="30" rx="5" fill="hsl(var(--foreground))" />
                  {/* Simplified piano keys */}
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <rect key={i} x={45 + i * 16} y="142" width="12" height="26" rx="2" fill="hsl(var(--background))" stroke="hsl(var(--muted))" />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <h3 className="text-3xl md:text-4xl font-black text-foreground mb-8">
              MASTER THE ART OF SIGHT READING
            </h3>
            
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/40 transition-colors">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-lg text-muted-foreground group-hover:text-foreground transition-colors pt-2">
                    {benefit.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyPerfectSection;
