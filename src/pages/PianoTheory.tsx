import { forwardRef } from "react";

const PianoTheory = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref}>
      <iframe
        src="/piano-theory.html"
        title="Piano Theory — Musicable"
        className="w-full h-screen border-0"
        style={{ minHeight: "100vh" }}
        allow="autoplay; microphone"
      />
    </div>
  );
});

PianoTheory.displayName = "PianoTheory";

export default PianoTheory;
