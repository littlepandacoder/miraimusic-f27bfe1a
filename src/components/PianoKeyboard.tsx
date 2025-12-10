import { useCallback, useEffect, useRef } from 'react';

const PianoKeyboard = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Note frequencies for two octaves starting from C4
  const noteFrequencies: { [key: string]: number } = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
    'A#4': 466.16, 'B4': 493.88, 'C5': 523.25, 'C#5': 554.37, 'D5': 587.33,
    'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
    'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
  };

  // White keys in order
  const whiteKeyNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'];
  
  // Black keys with their positions (index of white key they're after)
  const blackKeys = [
    { note: 'C#4', afterWhite: 0 },
    { note: 'D#4', afterWhite: 1 },
    { note: 'F#4', afterWhite: 3 },
    { note: 'G#4', afterWhite: 4 },
    { note: 'A#4', afterWhite: 5 },
    { note: 'C#5', afterWhite: 7 },
    { note: 'D#5', afterWhite: 8 },
    { note: 'F#5', afterWhite: 10 },
    { note: 'G#5', afterWhite: 11 },
    { note: 'A#5', afterWhite: 12 },
  ];

  // Keyboard mapping
  const keyboardMap: { [key: string]: string } = {
    'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4', 'f': 'F4',
    't': 'F#4', 'g': 'G4', 'y': 'G#4', 'h': 'A4', 'u': 'A#4', 'j': 'B4',
    'k': 'C5', 'o': 'C#5', 'l': 'D5', 'p': 'D#5', ';': 'E5'
  };

  const playNote = useCallback((note: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const frequency = noteFrequencies[note];
    if (!frequency) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // Piano-like envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1.5);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const note = keyboardMap[e.key.toLowerCase()];
      if (note) playNote(note);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playNote]);

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

      {/* Piano keys container */}
      <div className="relative">
        {/* White keys */}
        <div className="flex gap-0.5">
          {whiteKeyNotes.map((note, index) => (
            <button
              key={note}
              onClick={() => playNote(note)}
              onTouchStart={() => playNote(note)}
              className="flex-1 h-32 bg-foreground rounded-b-md border border-muted-foreground/20 hover:bg-muted-foreground/90 active:bg-muted-foreground/80 active:transform active:translate-y-0.5 transition-all cursor-pointer shadow-md"
            />
          ))}
        </div>
        
        {/* Black keys - absolutely positioned */}
        {blackKeys.map(({ note, afterWhite }) => {
          const keyWidth = 100 / 14;
          const leftPos = (afterWhite + 1) * keyWidth - (keyWidth * 0.3);
          
          return (
            <button
              key={note}
              onClick={() => playNote(note)}
              onTouchStart={() => playNote(note)}
              className="absolute top-0 w-[5%] h-20 bg-navy-dark rounded-b-md hover:bg-navy active:bg-navy-dark/80 active:transform active:translate-y-0.5 transition-all cursor-pointer z-10 shadow-lg"
              style={{ left: `${leftPos}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PianoKeyboard;
