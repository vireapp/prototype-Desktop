import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { LucideIcon, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  enablePasswordToggle?: boolean;
}

export function AnimatedInput({
  label,
  icon: Icon,
  className,
  type,
  enablePasswordToggle,
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value);
  const [showPassword, setShowPassword] = useState(false);

  const inputType = enablePasswordToggle && showPassword ? "text" : type;

  return (
    <div className="relative group w-full">
      <motion.div
        initial={false}
        animate={
          isFocused || hasValue
            ? { y: 6, x: Icon ? 36 : 12, scale: 0.75 }
            : { y: 16, x: Icon ? 36 : 12, scale: 1 }
        }
        className={cn(
          "absolute left-0 top-0 origin-left pointer-events-none flex items-center gap-2 will-change-transform z-10 transition-colors duration-200",
          isFocused || hasValue
            ? "text-zinc-500 dark:text-zinc-400 font-medium"
            : "text-zinc-500 dark:text-zinc-400",
        )}
      >
        {Icon && !(isFocused || hasValue) && <Icon className="w-4 h-4 opacity-70" />}
        <span>{label}</span>
      </motion.div>

      <div className="relative">
        {Icon && (
          <div
            className={cn(
              "absolute left-3 pointer-events-none transition-all duration-200 text-zinc-400 dark:text-zinc-500",
              isFocused || hasValue ? "top-4 opacity-100" : "top-1/2 -translate-y-1/2 opacity-0",
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <Input
          {...props}
          type={inputType}
          className={cn(
            "h-14 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-transparent",
            "focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100",
            "transition-all duration-200 shadow-sm rounded-lg pt-5 pb-1",
            Icon ? "pl-10" : "pl-3",
            enablePasswordToggle && "pr-10",
            className,
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            setHasValue(!!e.target.value);
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
          }}
        />

        {/* Password Toggle Button */}
        {enablePasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
