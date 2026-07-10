import { type InputHTMLAttributes, forwardRef, useId } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-sm text-white/50 font-medium">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5',
            'text-sm text-white placeholder:text-white/25',
            'focus:border-violet-500 focus:bg-white/8 transition-colors',
            error && 'border-red-500/50 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
