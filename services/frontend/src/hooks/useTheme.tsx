import { createContext, useContext, useEffect, useState } from "react";
import { Setter } from "@/types/utils";

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
    document
      .getElementsByTagName("body")
      .item(0)!
      .setAttribute("class", theme.value);
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

    realSetTheme({ value: checkedNewTheme });
  };

  return { setTheme, ...rest };
};
