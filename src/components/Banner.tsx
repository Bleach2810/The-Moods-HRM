"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function Banner() {
  const items = [
    "✦ TÍCH ĐIỂM MỌI HÓA ĐƠN — ĐỔI VOUCHER 55K",
    "🎯 10 ĐIỂM = 1 VOUCHER GIẢM GIÁ",
    "⚡ THE MOODS — SPECIALTY COFFEE & LIFESTYLE",
    "📲 QUÉT QR TẠI QUẦY — NHẬN ĐIỂM NGAY",
  ];

  const repeated = [...items, ...items, ...items];

  return (
    <div className="w-full py-3.5 overflow-hidden border-b border-[#7c4831]/10 relative select-none bg-[#F4EADF] z-20">
      <div className="flex animate-marquee whitespace-nowrap gap-10 text-xs font-semibold tracking-wider uppercase items-center text-[#7c4831]">
        {repeated.map((text, i) => (
          <div key={i} className="flex items-center gap-3.5 hover:opacity-85 transition-opacity">
            <span className="font-sans font-bold text-[11px]">{text}</span>
            <Sparkles size={10} className="text-[#7c4831]" />
          </div>
        ))}
      </div>
    </div>
  );
}
