import { forwardRef } from "react";

const PianoHero = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref}>
      <main>
        <iframe
          src="/piano-hero.html"
          title="Piano Hero — Musicable"
          className="w-full h-screen border-0"
          style={{ minHeight: "100vh" }}
          allow="autoplay *; microphone; midi"
        />
      </main>
    </div>
  );
});

PianoHero.displayName = "PianoHero";

export default PianoHero;
