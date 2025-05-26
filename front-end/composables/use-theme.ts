export type Theme = "light" | "dark";

export const useTheme = () => {
  const theme = useState<Theme>("theme", () => "light");

  const toggleTheme = () => {
    theme.value = theme.value === "dark" ? "light" : "dark";
  };

  const setTheme = (value: Theme = "light") => {
    theme.value = value;
  };

  watch(theme, (newValue) => {
    if (import.meta.client) {
      localStorage.setItem("theme", newValue);
      document.body.classList.toggle("is-dark", newValue === "dark");
      document.body.classList.toggle("is-light", newValue === "light");
    }
  });

  return { theme, toggleTheme, setTheme };
};
