"use client";

import React from "react";

interface SharkDecorProps {
  className?: string;
  size?: number;
  opacity?: number;
}

const SharkDecor: React.FC<SharkDecorProps> = ({ 
  className = "", 
  size = 120, 
  opacity = 0.05 
}) => {
  return (
    <div 
      className={`pointer-events-none select-none absolute z-0 animate-pulse ${className}`}
      style={{ opacity, width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-full h-full text-primary"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M21,12C21,12 18,5 12,5C6,5 3,12 3,12C3,12 6,19 12,19C18,19 21,12 21,12ZM12,17C9.24,17 7,14.76 7,12C7,9.24 9.24,7 12,7C14.76,7 17,9.24 17,12C17,14.76 14.76,17 12,17ZM12,9C10.34,9 9,10.34 9,12C9,13.66 10.34,15 12,15C13.66,15 15,13.66 15,12C15,10.34 13.66,9 12,9Z" opacity="0.3" />
        <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
      </svg>
    </div>
  );
};

export default SharkDecor;
