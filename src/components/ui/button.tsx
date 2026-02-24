import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
const buttonVariants = cva(
    "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-md border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 aria-invalid:ring-3 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground hover:bg-primary/80",
                outline:
                    "border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground shadow-xs",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
                ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
                destructive:
                    "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default:
                    "h-9 gap-1.5 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
                xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
                sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
                lg: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
                icon: "size-9",
                "icon-xs":
                    "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
                "icon-sm":
                    "size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md",
                "icon-lg": "size-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);
*/

const buttonVariants = cva(
    "inline-flex cursor-pointer shrink-0 items-center justify-center whitespace-nowrap border border-transparent text-sm font-black uppercase tracking-[0.14em] transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
    {
        variants: {
            variant: {
                primary:
                    "border-foreground bg-foreground text-background hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--color-foreground)]",
                secondary:
                    "border-2 border-foreground/40 bg-background text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
                outline:
                    "border-2 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background",
                ghost: "text-foreground hover:bg-foreground/10",
                destructive:
                    "border-destructive bg-destructive text-white hover:bg-destructive/90",
                link: "text-foreground underline underline-offset-4 hover:text-muted-foreground",
                utility:
                    "bg-background text-foreground hover:bg-foreground hover:text-background rounded-none border-4 border-foreground focus-visible:border-foreground focus-visible:ring-0",
            },
            size: {
                sm: "h-8 gap-1 px-2.5 text-xs",
                md: "h-10 gap-2 px-4",
                lg: "h-12 gap-2 px-6 text-sm",
                "icon-sm": "size-7 p-0",
                "icon-md": "size-10 p-0",
                "fit-square": "h-full aspect-square",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    },
);

function Button({
    className,
    variant = "primary",
    size = "md",
    ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
    return (
        <ButtonPrimitive
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
