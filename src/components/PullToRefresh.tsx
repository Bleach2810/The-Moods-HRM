"use client";

import React, { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh?: () => Promise<void> | void;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullOffset, setPullOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isPullingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find the scrollable container parent.
    // In our app layout, this is typically the <main> tag or any element with .overflow-y-auto.
    const scrollParent = container.closest(".overflow-y-auto") || container;

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;

      // Ignore pull-to-refresh if touch started on or inside a <header> element
      const target = e.target as HTMLElement | null;
      if (target && target.closest("header")) {
        return;
      }

      // Only trigger if we are at the very top of the scroll container
      if (scrollParent.scrollTop <= 0) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || !touchStartRef.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - touchStartRef.current.y;
      const diffX = currentX - touchStartRef.current.x;

      // Only pull if pulling downwards and not scrolling horizontally
      if (diffY > 0 && Math.abs(diffY) > Math.abs(diffX)) {
        if (scrollParent.scrollTop <= 0) {
          // Prevent native overscroll / elastic banding to let custom loader render cleanly
          if (e.cancelable) {
            e.preventDefault();
          }
          // Logarithmic resistance
          const offset = Math.min(80, diffY * 0.45);
          setPullOffset(offset);
        } else {
          isPullingRef.current = false;
        }
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;
      touchStartRef.current = null;

      if (pullOffset >= 50) {
        setIsRefreshing(true);
        setPullOffset(50);

        // Spin loader for 600ms before reloading or running the callback
        setTimeout(async () => {
          try {
            if (onRefresh) {
              await onRefresh();
            } else {
              window.location.reload();
            }
          } catch (err) {
            console.error(err);
          } finally {
            setIsRefreshing(false);
            setPullOffset(0);
          }
        }, 600);
      } else {
        setPullOffset(0);
      }
    };

    scrollParent.addEventListener("touchstart", handleTouchStart as any, { passive: true });
    scrollParent.addEventListener("touchmove", handleTouchMove as any, { passive: false });
    scrollParent.addEventListener("touchend", handleTouchEnd as any, { passive: true });

    return () => {
      scrollParent.removeEventListener("touchstart", handleTouchStart as any);
      scrollParent.removeEventListener("touchmove", handleTouchMove as any);
      scrollParent.removeEventListener("touchend", handleTouchEnd as any);
    };
  }, [pullOffset, isRefreshing, onRefresh]);

  const rotation = Math.min(360, (pullOffset / 50) * 360);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Premium pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none transition-all duration-150 ease-out"
        style={{
          transform: `translateY(${pullOffset - 40}px)`,
          opacity: Math.min(1, pullOffset / 40),
        }}
      >
        <div className="bg-[#FAF9F6]/90 backdrop-blur-md border border-[#7c4831]/20 shadow-md rounded-full p-2.5 flex items-center justify-center">
          <RefreshCw
            size={16}
            className={`text-[#7c4831] ${isRefreshing ? "animate-spin" : ""}`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
              transition: isRefreshing ? undefined : "transform 0.05s ease-out",
            }}
          />
        </div>
      </div>

      {/* Wrapper shifting the screen down during pull */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? 50 : pullOffset}px)`,
          transition: isPullingRef.current ? "none" : "transform 0.3s cubic-bezier(0.1, 0.8, 0.3, 1)",
        }}
        className="w-full h-full"
      >
        {children}
      </div>
    </div>
  );
}
