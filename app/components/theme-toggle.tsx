"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-7 w-[84px]" />;

  const options = [
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
    { value: "system", icon: Monitor },
  ] as const;

  return (
    <div className="flex items-center rounded-md border border-border overflow-hidden">
      {options.map(({ value, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={value.charAt(0).toUpperCase() + value.slice(1)}
          className={`h-7 w-7 flex items-center justify-center transition-colors ${
            theme === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
