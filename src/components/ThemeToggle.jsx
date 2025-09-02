import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

import { useTheme } from "../contexts/useTheme";

export default function ThemeToggle() {
  const { state, dispatch } = useTheme();

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "TOGGLE_THEME" })}
      className="rounded-full p-1 text-gray-400 hover:text-gray-600"
    >
      <span className="sr-only">Toggle theme</span>
      {state.isDark ? (
        <SunIcon
          data-testid="sun-icon"
          className="h-6 w-6"
          aria-hidden="true"
        />
      ) : (
        <MoonIcon
          data-testid="moon-icon"
          className="h-6 w-6"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
