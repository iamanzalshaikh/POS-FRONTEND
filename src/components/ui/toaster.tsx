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
import { CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    destructive: <XCircle className="h-5 w-5 text-rose-600" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
    default: null,
  }

  return (
    <ToastProvider duration={5000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const variant = (props as any).variant || 'default';
        const Icon = icons[variant as keyof typeof icons];
        
        const duration = 
          variant === 'success' || variant === 'info' || variant === 'default' ? 3500 :
          variant === 'warning' ? 6000 :
          variant === 'destructive' ? 10000 : 5000;

        return (
          <Toast key={id} {...props} duration={duration} className="overflow-hidden">
            <div className="flex items-start gap-4 w-full">
              {Icon && (
                <div className={cn(
                  "mt-1 p-2 rounded-xl flex-shrink-0 shadow-sm transition-colors",
                  variant === 'success' && "bg-emerald-100/50 dark:bg-emerald-950/50",
                  variant === 'destructive' && "bg-rose-100/50 dark:bg-rose-950/50",
                  variant === 'warning' && "bg-amber-100/50 dark:bg-amber-950/50",
                  variant === 'info' && "bg-blue-100/50 dark:bg-blue-950/50",
                  variant === 'default' && "bg-slate-100/50 dark:bg-slate-900"
                )}>
                  {Icon}
                </div>
              )}
              <div className="flex flex-col gap-1 flex-1 py-1 overflow-hidden text-left">
                {title && (
                  <ToastTitle className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className={cn(
                    "text-[11px] font-bold leading-relaxed opacity-70 break-all",
                    variant === 'destructive' ? "text-rose-950 dark:text-rose-200" : "text-slate-600 dark:text-slate-400"
                  )}>
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="top-4 right-4" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
