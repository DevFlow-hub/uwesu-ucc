import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply default forest theme on initial load
const savedTheme = localStorage.getItem("theme") || "forest";
document.documentElement.classList.add(savedTheme);
if (!localStorage.getItem("theme")) {
  localStorage.setItem("theme", "forest");
}

createRoot(document.getElementById("root")!).render(<App />);
