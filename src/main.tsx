import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Set default theme to SUNSET (not forest)
const savedTheme = localStorage.getItem("theme");

if (!savedTheme) {
  // First time - set sunset as default
  localStorage.setItem("theme", "sunset");
  document.documentElement.className = "sunset";
} else {
  // Use saved theme
  document.documentElement.className = savedTheme;
}

// Remove any loading elements that might exist
const loadingElements = document.querySelectorAll('[id*="loading"], [class*="loading"]');
loadingElements.forEach(el => el.remove());

createRoot(document.getElementById("root")!).render(<App />);