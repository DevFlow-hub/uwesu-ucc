import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply default theme
const savedTheme = localStorage.getItem("theme") || "forest";
document.documentElement.classList.add(savedTheme);
if (!localStorage.getItem("theme")) {
  localStorage.setItem("theme", "forest");
}

// Remove any loading elements that might exist
const loadingElements = document.querySelectorAll('[id*="loading"], [class*="loading"]');
loadingElements.forEach(el => el.remove());

createRoot(document.getElementById("root")!).render(<App />);