import { forwardRef } from "react";

const SightReading = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref}>
      <main>
        <iframe
          src="/sight-reading.html"
          title="Sight Reading Trainer — Musicable"
          className="w-full h-screen border-0"
          style={{ minHeight: "100vh" }}
          allow="autoplay; microphone"
          loading="lazy"
        />
      </main>
    </div>
  );
});

SightReading.displayName = "SightReading";

export default SightReading;
