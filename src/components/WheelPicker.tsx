"use client";

import React, { useRef, useEffect, useState } from "react";

interface WheelPickerProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  itemHeight?: number;
}

export default function WheelPicker({
  options,
  value,
  onChange,
  itemHeight = 40,
}: WheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find active index
  const activeIndex = options.indexOf(value);
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // Sync scroll position when value changes from outside
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isScrolling) return;

    const targetScrollTop = safeActiveIndex * itemHeight;
    if (Math.abs(container.scrollTop - targetScrollTop) > 2) {
      container.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
  }, [value, safeActiveIndex, itemHeight, isScrolling]);

  // Handle scroll events to detect selected item
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolling(true);
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    
    // Calculate snapped index
    const snappedIndex = Math.round(scrollTop / itemHeight);
    const boundedIndex = Math.max(0, Math.min(options.length - 1, snappedIndex));

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Trigger change after scroll settles (debounced)
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      const finalScrollTop = boundedIndex * itemHeight;
      // Scroll exactly to target in case it didn't snap perfectly
      container.scrollTo({
        top: finalScrollTop,
        behavior: "smooth",
      });

      if (options[boundedIndex] !== value) {
        onChange(options[boundedIndex]);
      }
    }, 150);
  };

  // Handle click on specific item to scroll to it
  const handleItemClick = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: index * itemHeight,
      behavior: "smooth",
    });
    onChange(options[index]);
  };

  return (
    <div className="relative w-full overflow-hidden bg-white border border-gray-150 rounded-2xl h-[160px] flex items-center justify-center">
      {/* Top & Bottom fade gradients */}
      <div className="absolute top-0 left-0 right-0 h-[48px] bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-[48px] bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

      {/* Target indicator lines */}
      <div 
        className="absolute left-3 right-3 border-y-2 border-[#7c4831]/20 pointer-events-none z-10 bg-[#7c4831]/[0.02]" 
        style={{ height: `${itemHeight}px`, top: `calc(50% - ${itemHeight / 2}px)` }}
      />

      {/* Scrollable list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth"
        style={{
          paddingTop: `calc(80px - ${itemHeight / 2}px)`,
          paddingBottom: `calc(80px - ${itemHeight / 2}px)`,
        }}
      >
        {options.map((option, idx) => {
          const isSelected = idx === safeActiveIndex;
          return (
            <div
              key={option}
              onClick={() => handleItemClick(idx)}
              className={`snap-center snap-always flex items-center justify-center font-bold transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? "text-sm text-[#7c4831] scale-105" 
                  : "text-xs text-gray-400 opacity-60"
              }`}
              style={{ height: `${itemHeight}px` }}
            >
              {option}
            </div>
          );
        })}
      </div>
    </div>
  );
}
