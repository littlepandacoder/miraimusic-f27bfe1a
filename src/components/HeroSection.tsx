import PianoKeyboard from "./PianoKeyboard";

const HeroSection = () => {
  return (
    <section id="home" className="min-h-screen pt-24 pb-16 flex flex-col justify-center">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-foreground mb-6 animate-slide-up leading-tight">
            LEARN<br />SMARTER
          </h1>
          <p className="text-xl md:text-2xl font-semibold mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <span className="text-pink">100% GUARANTEED</span>{" "}
            <span className="text-foreground">PASS YOUR TRINITY PIANO EXAM</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="#assessment" 
              className="btn-primary inline-block animate-slide-up animate-pulse-glow"
              style={{ animationDelay: "0.2s" }}
            >
              DON'T THINK JUST CLICK
            </a>
            <a 
              href="https://www.skool.com/pianomastery90days/about?ref=76fa2e8809594da080da4f38ee98471a"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-transparent border-2 border-pink text-pink font-bold text-lg rounded-full hover:bg-pink hover:text-background transition-all duration-300 animate-slide-up"
              style={{ animationDelay: "0.25s" }}
            >
              JOIN SKOOL COMMUNITY
            </a>
          </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <PianoKeyboard />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
