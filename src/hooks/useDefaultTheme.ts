import { useEffect } from "react";

/**
 * Forces the default (dark) theme on public pages like landing, login, signup, pricing.
 * Restores the user's saved theme on unmount.
 */
export function useDefaultTheme() {
  useEffect(() => {
    const saved = document.documentElement.getAttribute("data-theme");
    // Remove custom theme to show default
    document.documentElement.removeAttribute("data-theme");

    return () => {
      // Restore user's theme when leaving the page
      const userTheme = localStorage.getItem("dasho-theme");
      if (userTheme && userTheme !== "dark") {
        document.documentElement.setAttribute("data-theme", userTheme);
      }
    };
  }, []);
}
