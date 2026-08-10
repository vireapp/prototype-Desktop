import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password?: string;
  className?: string;
}

export function validatePassword(password: string) {
  const hasLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const score = [hasLength, hasUpperCase, hasNumber, hasSymbol].filter(Boolean).length;
  const isValid = score === 4;

  return { hasLength, hasUpperCase, hasNumber, hasSymbol, score, isValid };
}

export function PasswordStrength({ password = "", className }: PasswordStrengthProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const { hasLength, hasUpperCase, hasNumber, hasSymbol, score } = validatePassword(password);

  // If no password, don't show the meter yet, or show it greyed out
  if (!password) {
    return null; // Or return a subtle placeholder if preferred
  }

  const getMeterColor = (index: number) => {
    if (score === 0) return "bg-zinc-200 dark:bg-zinc-800";
    if (score <= 2) {
      return index < score ? "bg-rose-500" : "bg-zinc-200 dark:bg-zinc-800";
    }
    if (score === 3) {
      return index < score ? "bg-amber-400" : "bg-zinc-200 dark:bg-zinc-800";
    }
    return index < score ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800";
  };

  const getStatusText = () => {
    if (score <= 1) return "Weak";
    if (score === 2) return "Fair";
    if (score === 3) return "Good";
    return "Strong";
  };

  const getStatusColor = () => {
    if (score <= 2) return "text-rose-500";
    if (score === 3) return "text-amber-500";
    return "text-emerald-500";
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-zinc-500 dark:text-zinc-400">Password strength</span>
        <span className={cn("font-medium transition-colors", getStatusColor())}>
          {getStatusText()}
        </span>
      </div>

      <div className="flex gap-1 h-1.5 w-full">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-full flex-1 rounded-full transition-colors duration-300",
              getMeterColor(i),
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
        <RequirementMet met={hasLength} text="At least 8 characters" />
        <RequirementMet met={hasUpperCase} text="One uppercase letter" />
        <RequirementMet met={hasNumber} text="One number" />
        <RequirementMet met={hasSymbol} text="One special character" />
      </div>
    </div>
  );
}

function RequirementMet({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 transition-colors duration-300",
        met ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-500",
      )}
    >
      {met ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-50" />}
      <span className={met ? "font-medium" : ""}>{text}</span>
    </div>
  );
}
