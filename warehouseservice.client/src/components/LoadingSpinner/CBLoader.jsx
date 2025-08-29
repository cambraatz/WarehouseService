import React from "react";

const CBLoader = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Letter C */}
        <path
          d="M120 50
             A50 50 0 1 0 120 150"
          stroke="white"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray="314"  // circumference of the path
          strokeDashoffset="314"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="314"
            to="0"
            dur="2s"
            begin="0s"
            fill="freeze"
          />
        </path>

        {/* Letter B */}
        <path
          d="M140 50 L140 150
             M140 50 Q180 70 140 100
             M140 100 Q180 130 140 150"
          stroke="white"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray="400"
          strokeDashoffset="400"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="400"
            to="0"
            dur="2s"
            begin="2s"   // starts after C finishes
            fill="freeze"
          />
        </path>
      </svg>
    </div>
  );
};

export default CBLoader;
