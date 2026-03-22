import { forwardRef } from "react";

const SightReading = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref}>
      <iframe
        src="/sight-reading.html"
        title="Sight Reading Trainer — Musicable"
        className="w-full h-screen border-0"
        style={{ minHeight: "100vh" }}
        allow="autoplay; microphone"
      />
    </div>
  );
});

SightReading.displayName = "SightReading";

export default SightReading;
