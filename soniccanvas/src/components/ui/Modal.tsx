import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: string
}

export function Modal({ open, onClose, title, children, width = 'max-w-md' }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className={`relative z-10 w-full ${width} mx-4 bg-surface-3 border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden`}
            initial={{ scale: 0.94, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 12 }}
            transition={{ type: 'spring', duration: 0.25 }}
          >
            {title && (
              <div className="shrink-0 flex items-center justify-between p-5 border-b border-white/8">
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="overflow-y-auto">
              <div className="p-5">{children}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
