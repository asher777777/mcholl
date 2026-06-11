import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ModalContextValue {
  isOpen: boolean
  close: () => void
  getTriggerProps: <T extends React.HTMLAttributes<HTMLElement>>(props?: T) => T & {
    "aria-haspopup": "dialog"
    "aria-expanded": boolean
    onClick: React.MouseEventHandler
  }
  getCloseProps: <T extends React.HTMLAttributes<HTMLElement>>(props?: T) => T & {
    onClick: React.MouseEventHandler
    "aria-label": string
  }
}

const ModalContext = React.createContext<ModalContextValue | undefined>(undefined)

function useModalContext() {
  const context = React.useContext(ModalContext)
  if (!context) {
    throw new Error("Modal components must be wrapped in <Modal />")
  }
  return context
}

export function Modal({ children, isOpen, onClose }: { children: React.ReactNode, isOpen: boolean, onClose: () => void }) {
  const getTriggerProps = React.useCallback(
    <T extends React.HTMLAttributes<HTMLElement>>(props: T = {} as T) => ({
      ...props,
      "aria-haspopup": "dialog" as const,
      "aria-expanded": isOpen,
      onClick: (e: React.MouseEvent) => {
        ;(props as any).onClick?.(e)
      }
    }),
    [isOpen]
  )

  const getCloseProps = React.useCallback(
    <T extends React.HTMLAttributes<HTMLElement>>(props: T = {} as T) => ({
      ...props,
      onClick: (e: React.MouseEvent) => {
        ;(props as any).onClick?.(e)
        onClose()
      },
      "aria-label": "Close dialog"
    }),
    [onClose]
  )

  const value = React.useMemo(() => ({ isOpen, close: onClose, getTriggerProps, getCloseProps }), [isOpen, onClose, getTriggerProps, getCloseProps])

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

Modal.Content = function ModalContent({ children, className }: { children: React.ReactNode, className?: string }) {
  const { isOpen } = useModalContext()
  
  // Only run on client
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => { document.body.style.overflow = "unset" }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={cn(
          "relative w-full max-w-lg rounded-lg bg-background p-6 shadow-xl animate-in zoom-in-95 duration-200",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

Modal.Header = function ModalHeader({ title, description }: { title: string, description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}

Modal.Close = function ModalClose({ className }: { className?: string }) {
  const { getCloseProps } = useModalContext()
  return (
    <button
      {...getCloseProps()}
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
        className
      )}
    >
      <X className="h-4 w-4" />
    </button>
  )
}

Modal.Footer = function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">{children}</div>
}
