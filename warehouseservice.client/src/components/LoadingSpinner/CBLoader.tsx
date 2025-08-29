import React, { useEffect, useRef } from "react";

const CBLoader: React.FC = () => {
  const cRef = useRef<SVGPathElement>(null);
  const bRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const animatePath = (path: SVGPathElement | null, delay: number) => {
      if (!path) return;
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.style.transition = "none";

      // Force reflow before applying animation
      void path.getBoundingClientRect();

      setTimeout(() => {
        path.style.transition = "stroke-dashoffset 2s ease";
        path.style.strokeDashoffset = "0";
      }, delay);
    };

    animatePath(cRef.current, 0);    // "C" first
    animatePath(bRef.current, 2200); // then "B" after
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg
        width="150"
        height="150"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* C */}
        <path
          ref={cRef}
          d="M130 40
             A60 60 0 1 0 130 160"
          stroke="black"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        {/* B */}
        <path
          ref={bRef}
          d="M70 40 L70 160
             M70 40 Q120 60 70 100
             M70 100 Q120 140 70 160"
          stroke="black"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

export default CBLoader;
