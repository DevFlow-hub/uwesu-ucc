import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

type Theme = "light" | "ocean" | "sunset" | "forest";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("forest");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as Theme) || "forest";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "ocean", "sunset", "forest");
    root.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {theme === "light" && <Sun className="h-4 w-4" />}
          {(theme === "ocean" || theme === "sunset" || theme === "forest") && <Palette className="h-4 w-4" />}
          <span className="hidden sm:inline">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeTheme("ocean")}>
          <Palette className="mr-2 h-4 w-4" />
          <span>Ocean</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeTheme("sunset")}>
          <Palette className="mr-2 h-4 w-4" />
          <span>Sunset</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeTheme("forest")}>
          <Palette className="mr-2 h-4 w-4" />
          <span>Forest</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
