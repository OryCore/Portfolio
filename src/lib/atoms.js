import { atom } from "jotai";

const getInitialTheme = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "dark";
  }
  return "dark";
};

export const themeAtom = atom(getInitialTheme());
