import React from "react";

interface InputFormProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const InputForm: React.FC<InputFormProps> = ({
  label,
  error,
  className = "",
  id,
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`input w-full text-xs font-semibold px-4 py-2.5 bg-white border border-[rgba(0,0,0,0.08)] rounded-xl outline-none transition-all duration-150 focus:border-[#7c4831] focus:ring-3 focus:ring-[rgba(124,72,49,0.06)] disabled:bg-[#EAE5DB] disabled:text-[rgba(75,54,33,0.4)] disabled:cursor-not-allowed ${
          error ? "border-red-500 focus:border-red-500" : ""
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide">
          {error}
        </p>
      )}
    </div>
  );
};
