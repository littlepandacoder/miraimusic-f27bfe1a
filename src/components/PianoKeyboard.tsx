const PianoKeyboard = () => {
  const whiteKeys = Array(14).fill(null);
  // Black key pattern per octave: C-D has black, D-E has black, E-F no black, F-G has black, G-A has black, A-B has black, B-C no black
  // This creates the 2-3 grouping pattern
  const blackKeyPattern = [1, 1, 0, 1, 1, 1, 0]; // 2 blacks, gap, 3 blacks, gap
  
  // Colors for the falling notes
  const noteColors = [
    { color: "bg-pink", left: "8%", delay: "0s", height: "60px" },
    { color: "bg-pink", left: "12%", delay: "0.2s", height: "45px" },
    { color: "bg-purple", left: "25%", delay: "0.4s", height: "55px" },
    { color: "bg-purple", left: "30%", delay: "0.1s", height: "40px" },
    { color: "bg-lime", left: "45%", delay: "0.3s", height: "65px" },
    { color: "bg-cyan", left: "55%", delay: "0.5s", height: "50px" },
    { color: "bg-cyan", left: "60%", delay: "0.2s", height: "45px" },
    { color: "bg-lime", left: "72%", delay: "0.4s", height: "55px" },
    { color: "bg-lime", left: "78%", delay: "0.1s", height: "60px" },
    { color: "bg-yellow", left: "88%", delay: "0.3s", height: "70px" },
  ];

  return (
    <div className="relative bg-card rounded-2xl p-4 piano-shadow max-w-4xl mx-auto">
      {/* Top bar with controls */}
      <div className="flex items-center gap-3 mb-4 bg-secondary/50 rounded-lg p-2">
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
        
        <div className="flex-1 flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5">
          <span className="text-pink">🎵</span>
          <span className="text-sm text-muted-foreground">Yiruma - River Flows in You</span>
        </div>
        
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-foreground"></div>
        </div>
      </div>

      {/* Falling notes area */}
      <div className="relative h-40 bg-secondary/30 rounded-lg mb-2 overflow-hidden">
        {noteColors.map((note, index) => (
          <div
            key={index}
            className={`absolute w-6 ${note.color} rounded-sm animate-float`}
            style={{
              left: note.left,
              top: "20%",
              height: note.height,
              animationDelay: note.delay,
              opacity: 0.9,
            }}
          />
        ))}
      </div>

      {/* Piano keys */}
      <div className="relative flex">
        {/* White keys */}
        {whiteKeys.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-32 bg-foreground rounded-b-md mx-0.5 border border-muted-foreground/20 hover:bg-muted-foreground/90 transition-colors cursor-pointer"
          />
        ))}
        
        {/* Black keys */}
        <div className="absolute top-0 left-0 right-0 pointer-events-none">
          {whiteKeys.slice(0, -1).map((_, index) => {
            const patternIndex = index % 7;
            if (blackKeyPattern[patternIndex] === 0) return null;
            
            // Position black key at the right edge of each white key
            const keyWidth = 100 / 14; // percentage width of each white key
            const leftPosition = (index + 1) * keyWidth - 2; // position at boundary minus offset
            
            return (
              <div
                key={index}
                className="absolute w-5 h-20 bg-navy-dark rounded-b-md pointer-events-auto hover:bg-navy transition-colors cursor-pointer z-10"
                style={{ left: `calc(${leftPosition}% - 10px)` }}
              />
            );
          })}
        </div>
        
        {/* Highlighted key */}
        <div 
          className="absolute top-0 h-32 w-[calc(100%/14)] bg-cyan rounded-b-md"
          style={{ left: "calc(50% - 3.5%)" }}
        />
      </div>
    </div>
  );
};

export default PianoKeyboard;
