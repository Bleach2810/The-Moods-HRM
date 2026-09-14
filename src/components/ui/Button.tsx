import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "success" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-sans font-medium rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.98] outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#7c4831] text-white hover:bg-[#643621] border border-transparent shadow-xs",
    ghost: "bg-[#FAF9F6] text-[#7c4831] hover:bg-[#F4EADF] border border-[rgba(124,72,49,0.1)]",
    success: "bg-[#FAF9F6] text-[#1B523A] hover:bg-[#D3ECE1] border border-[rgba(27,82,58,0.15)]",
    danger: "bg-[#FAF9F6] text-[#7A2F1E] hover:bg-[#FADCD5] border border-[rgba(122,47,30,0.15)]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px] md:text-xs",
    md: "px-5 py-2.5 text-xs md:text-sm",
    lg: "px-7 py-3.5 text-sm md:text-base",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
