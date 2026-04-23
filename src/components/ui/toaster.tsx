"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast-primitives"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const variant = (props as any).variant || 'default';
        const duration = 
          variant === 'success' || variant === 'info' || variant === 'default' ? 3500 :
          variant === 'warning' ? 6000 :
          variant === 'destructive' ? 8000 : 5000;

        return (
          <Toast key={id} {...props} duration={duration}>
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              {title && <ToastTitle className="text-lg font-black uppercase tracking-tight">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs font-medium opacity-80 max-w-[280px]">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
