import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Setter } from "@/types/utils";
import { Moon, Sun } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

export const ThemeContext = createContext<{
  theme: { value: Theme };
  setTheme: Setter<{ value: Theme }>;
}>({
  theme: { value: "dark" },
  setTheme: () => {
    throw new Error("Not under theme provider");
  },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<{ value: Theme }>({ value: "dark" });

  useEffect(() => {
    const currentTheme = document.getElementsByTagName("body").item(0)!;
    const hasDark = currentTheme.className.includes("dark");
    const hasLight = currentTheme.className.includes("light");
    if (!hasDark && !hasLight) {
      localStorage.setItem("theme", "dark");
      setTheme({ value: "dark" });
      return;
    }

    if (hasDark) {
      setTheme({ value: "dark" });
      return;
    }
    if (hasLight) {
      setTheme({ value: "light" });
      return;
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        setTheme,
        theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const { setTheme: realSetTheme, ...rest } = useContext(ThemeContext);

  const setTheme = (newTheme: Theme | ((prevTheme: Theme) => Theme)) => {
    const checkedNewTheme =
      typeof newTheme === "function" ? newTheme(rest.theme.value) : newTheme;
    document
      .getElementsByTagName("body")
      .item(0)!
      .setAttribute("class", checkedNewTheme);

    localStorage.setItem("theme", checkedNewTheme);

    realSetTheme({ value: checkedNewTheme });
  };

  return { setTheme, ...rest };
};

export const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant={"ghost"}
      onClick={() => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
      }}
    >
      {theme.value === "light" ? <Sun /> : <Moon />}
    </Button>
  );
};
