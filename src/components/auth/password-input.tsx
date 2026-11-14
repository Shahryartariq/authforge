"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { passwordStrength } from "@/lib/validation";

type Props = React.ComponentProps<"input"> & { showStrength?: boolean };

export function PasswordInput({ showStrength, className, onChange, ...props }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");

  // `form.reset()` empties the field without a change event, which would leave
  // the strength meter showing the old password's score.
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const clear = () => setValue("");
    form.addEventListener("reset", clear);
    return () => form.removeEventListener("reset", clear);
  }, []);
  const score = passwordStrength(value);
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-border", "bg-destructive", "bg-amber-500", "bg-brand", "bg-success"];

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          ref={input}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e);
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showStrength && value && (
        <div className="flex items-center gap-2" aria-live="polite">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full", i <= score ? colors[score] : "bg-border")} />
            ))}
          </div>
          <span className="w-16 text-right text-xs text-muted-foreground">{labels[score]}</span>
        </div>
      )}
    </div>
  );
}
