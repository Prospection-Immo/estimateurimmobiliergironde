import { ThemeProvider } from '../ThemeProvider'
import { Button } from "@/components/ui/button"
import { useTheme } from '../ThemeProvider'

function ThemeToggleDemo() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Thème actuel: {theme}</h3>
      <div className="flex gap-2">
        <Button 
          variant={theme === "light" ? "default" : "outline"}
          onClick={() => setTheme("light")}
        >
          Clair
        </Button>
        <Button 
          variant={theme === "dark" ? "default" : "outline"}
          onClick={() => setTheme("dark")}
        >
          Sombre
        </Button>
        <Button 
          variant={theme === "system" ? "default" : "outline"}
          onClick={() => setTheme("system")}
        >
          Système
        </Button>
      </div>
    </div>
  )
}

export default function ThemeProviderExample() {
  return (
    <ThemeProvider>
      <ThemeToggleDemo />
    </ThemeProvider>
  )
}