import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atc-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-6',
  {
    variants: {
      variant: {
        default: 'bg-atc-primary text-white hover:bg-atc-primary-hover active:bg-atc-primary-active',
        secondary: 'bg-white border border-atc-border text-atc-text hover:bg-atc-bg-subtle',
        destructive: 'bg-atc-danger text-white hover:bg-red-600',
        outline: 'border border-atc-border bg-transparent hover:bg-atc-bg-subtle',
        ghost: 'hover:bg-atc-bg-subtle',
        link: 'text-atc-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6',
        sm: 'h-9 px-4',
        lg: 'h-12 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
