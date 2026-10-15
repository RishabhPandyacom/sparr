import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-clip-padding text-sm font-bold whitespace-nowrap transition-all outline-none select-none shadow-[3px_3px_0_var(--brand-ink)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_var(--brand-ink)] focus-visible:ring-4 focus-visible:ring-purple/30 active:not-aria-[haspopup]:translate-x-[3px] active:not-aria-[haspopup]:translate-y-[3px] active:not-aria-[haspopup]:shadow-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-purple-dark",
        outline:
          "bg-white text-ink hover:bg-surface aria-expanded:bg-surface",
        secondary:
          "bg-lime text-ink hover:bg-lime aria-expanded:bg-lime",
        ghost:
          "border-transparent bg-transparent shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-surface hover:shadow-none active:translate-x-0 active:translate-y-0 aria-expanded:bg-surface",
        destructive:
          "bg-pink-tint text-pink-dark hover:bg-pink-tint focus-visible:ring-pink/30",
        link: "border-transparent bg-transparent text-primary shadow-none underline-offset-4 hover:translate-x-0 hover:translate-y-0 hover:underline hover:shadow-none active:translate-x-0 active:translate-y-0",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-10",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * `asChild` is supported as a convenience shim over Base UI's `render` prop:
 * `<Button asChild><Link/></Button>` renders the Link with button styling.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const asChildEl =
    asChild && React.isValidElement(children)
      ? (children as React.ReactElement)
      : null

  // When rendering as a non-<button> element (e.g. a Link/anchor), tell Base UI
  // so it doesn't warn about missing native button semantics.
  const composed = asChildEl
    ? { render: asChildEl, nativeButton: asChildEl.type === "button" }
    : { children }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...composed}
      {...props}
      // A custom `render` element (usually a Link) is not a native <button>.
      {...(props.render && props.nativeButton === undefined ? { nativeButton: false } : {})}
    />
  )
}

export { Button, buttonVariants }
