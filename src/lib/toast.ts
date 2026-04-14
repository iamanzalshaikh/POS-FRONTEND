import { toast as toastHook } from "@/hooks/use-toast"

/**
 * Global toast utility to trigger notifications from anywhere.
 */
export const toast = {
  success: (message: string, title: string = "Success") => {
    return toastHook({
      variant: "success",
      title,
      description: message,
    })
  },
  error: (message: string, title: string = "Error") => {
    return toastHook({
      variant: "destructive",
      title,
      description: message,
    })
  },
  warning: (message: string, title: string = "Warning") => {
    return toastHook({
      variant: "warning",
      title,
      description: message,
    })
  },
  info: (message: string, title: string = "Information") => {
    return toastHook({
      variant: "info",
      title,
      description: message,
    })
  },
  dismiss: (id?: string) => {
    // Note: To dismiss via the global utility, we would need to expose the dispatch mechanism
    // but typically useToast() is used for programmatic dismissal within components.
    // For now, these are the primary trigger methods.
  }
}
