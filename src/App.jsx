// src/App.jsx
import React, { Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAtom } from "jotai";
import { themeAtom } from "./lib/atoms";
import { Sun, Moon } from "lucide-react";
import Home from "./pages/Home";

// Removed the .catch() so the real error hits the console
const Lab = React.lazy(() => import("./pages/Lab"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const LoadingScreen = () => {
  const texts = ["Loading...", "Compiling shaders..."];
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <p className="text-sm font-mono text-muted-foreground animate-pulse">{texts[textIndex]}</p>
    </div>
  );
};

const ThemeToggle = () => {
  const [theme, setTheme] = useAtom(themeAtom);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="fixed top-6 right-6 z-50 p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-all active:scale-95" aria-label="Toggle theme">
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};

export default function App() {
  return (
    <Router>
      <ThemeToggle />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
