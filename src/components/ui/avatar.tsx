import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const AvatarLoadingContext = React.createContext<{
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
} | null>(null)

function Avatar({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  const [loading, setLoading] = React.useState(false)

  return (
    <AvatarLoadingContext.Provider value={{ loading, setLoading }}>
      <AvatarPrimitive.Root
        data-slot="avatar"
        className={cn(
          "relative flex size-8 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      >
        {children}
      </AvatarPrimitive.Root>
    </AvatarLoadingContext.Provider>
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  const propsTyped = props as React.ComponentProps<typeof AvatarPrimitive.Image>
  const { src, onLoad, onError, ...rest } = propsTyped

  const ctx = React.useContext(AvatarLoadingContext)
  const setLoading = ctx?.setLoading
  const loading = ctx?.loading ?? false

  React.useEffect(() => {
    // when src changes, mark loading true if there's a src
    if (setLoading) setLoading(!!src)
  }, [src, setLoading])

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (setLoading) setLoading(false)
    if (typeof onLoad === "function") onLoad(e)
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (setLoading) setLoading(false)
    if (typeof onError === "function") onError(e)
  }

  return (
    <div data-slot="avatar-image" data-loading={loading ? "true" : "false"} className="relative w-full h-full">
      {src ? (
        <AvatarPrimitive.Image
          className={cn("w-full h-full", className)}
          src={src}
          onLoad={handleLoad}
          onError={handleError}
          {...rest}
        />
      ) : null}

      {/* loader */}
      {loading && src && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-transparent">
          <span className="inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  const ctx = React.useContext(AvatarLoadingContext)
  const loading = ctx?.loading ?? false

  if (loading) {
    return null
  }

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        // fill the parent container so the fallback respects the parent's
        // dimensions and border-radius (don't force rounded-full here)
        "bg-muted flex w-full h-full items-center justify-center",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
