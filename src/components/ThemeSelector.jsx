import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

import { useTheme } from "../contexts/useTheme";

const themeOptions = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: ComputerDesktopIcon },
];

export default function ThemeSelector() {
  const { state, setThemeMode } = useTheme();

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-surface border border-border rounded-lg">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = state.mode === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleThemeChange(option.value)}
            className={`
              flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-text hover:bg-border/50"
              }
            `}
            title={`Switch to ${option.label} theme`}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4 mr-1.5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
