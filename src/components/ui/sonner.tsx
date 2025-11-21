import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={10000}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--toast-width": "600px",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          width: "600px",
          minWidth: "600px",
          maxWidth: "600px",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
