import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const inputGroupVariants = cva(
    "border-input dark:bg-input/30 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 h-9 rounded-md border shadow-xs transition-[color,box-shadow] in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-[[data-slot][aria-invalid=true]]:ring-3 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5 group/input-group relative flex w-full min-w-0 items-center outline-none has-[>textarea]:h-auto",
    {
        variants: {
            surface: {
                default: "",
                bare: "h-auto border-0 bg-transparent shadow-none",
                framed: "relative h-auto border-4 border-foreground bg-background shadow-none",
            },
        },
        defaultVariants: {
            surface: "default",
        },
    },
);

function InputGroup({
    className,
    surface = "default",
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupVariants>) {
    return (
        <div
            data-slot="input-group"
            role="group"
            className={cn(inputGroupVariants({ surface }), className)}
            {...props}
        />
    );
}

const inputGroupAddonVariants = cva(
    "text-muted-foreground h-auto gap-2 py-1.5 text-sm font-medium group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4 flex cursor-text items-center justify-center select-none",
    {
        variants: {
            layout: {
                default: "",
                "attached-end":
                    "self-stretch items-stretch py-0 pr-0 has-[>button]:-mr-0",
                "floating-end":
                    "absolute right-2 top-2 z-10 py-0 pr-0 has-[>button]:mr-0",
            },
            align: {
                "inline-start":
                    "pl-2 has-[>button]:-ml-1 has-[>kbd]:ml-[-0.15rem] order-first",
                "inline-end":
                    "pr-2 has-[>button]:-mr-1 has-[>kbd]:mr-[-0.15rem] order-last",
                "block-start":
                    "px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2 order-first w-full justify-start",
                "block-end":
                    "px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2 order-last w-full justify-start",
            },
        },
        defaultVariants: {
            layout: "default",
            align: "inline-start",
        },
    },
);

function InputGroupAddon({
    className,
    layout = "default",
    align = "inline-start",
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
    return (
        <div
            role="group"
            data-slot="input-group-addon"
            data-align={align}
            className={cn(
                inputGroupAddonVariants({ align, layout }),
                className,
            )}
            onClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) {
                    return;
                }
                (
                    e.currentTarget.parentElement?.querySelector(
                        "[data-slot='input-group-control']",
                    ) as HTMLElement | null
                )?.focus();
            }}
            {...props}
        />
    );
}

const inputGroupButtonVariants = cva(
    "gap-2 text-sm shadow-none flex items-center",
    {
        variants: {
            size: {
                sm: "h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
                md: "",
                "fit-square": "h-full aspect-square",
                "icon-sm":
                    "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
                "icon-md": "size-8 p-0 has-[>svg]:p-0",
            },
        },
        defaultVariants: {
            size: "sm",
        },
    },
);

function InputGroupButton({
    className,
    type = "button",
    variant = "ghost",
    size = "sm",
    ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> &
    VariantProps<typeof inputGroupButtonVariants> & {
        type?: "button" | "submit" | "reset";
    }) {
    return (
        <Button
            type={type}
            data-size={size}
            variant={variant}
            className={cn(inputGroupButtonVariants({ size }), className)}
            {...props}
        />
    );
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            className={cn(
                "text-muted-foreground gap-2 text-sm [&_svg:not([class*='size-'])]:size-4 flex items-center [&_svg]:pointer-events-none",
                className,
            )}
            {...props}
        />
    );
}

const inputGroupInputVariants = cva(
    "rounded-none border-0 shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent flex-1",
    {
        variants: {
            tone: {
                default: "",
                "framed-mono":
                    "h-auto border-4 border-r-0 border-foreground bg-background px-4 py-3 font-mono text-sm focus-visible:border-foreground focus-visible:ring-0",
            },
        },
        defaultVariants: {
            tone: "default",
        },
    },
);

function InputGroupInput({
    className,
    tone = "default",
    ...props
}: React.ComponentProps<"input"> &
    VariantProps<typeof inputGroupInputVariants>) {
    return (
        <Input
            data-slot="input-group-control"
            className={cn(inputGroupInputVariants({ tone }), className)}
            {...props}
        />
    );
}

const inputGroupTextareaVariants = cva(
    "rounded-none border-0 shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent flex-1 resize-none",
    {
        variants: {
            tone: {
                default: "",
                "framed-mono":
                    "min-h-0 bg-background px-4 py-3 pr-8 font-mono text-sm leading-6 focus-visible:border-foreground focus-visible:ring-0",
            },
        },
        defaultVariants: {
            tone: "default",
        },
    },
);

function InputGroupTextarea({
    className,
    tone = "default",
    ...props
}: React.ComponentProps<"textarea"> &
    VariantProps<typeof inputGroupTextareaVariants>) {
    return (
        <Textarea
            data-slot="input-group-control"
            className={cn(inputGroupTextareaVariants({ tone }), className)}
            {...props}
        />
    );
}

export {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupText,
    InputGroupInput,
    InputGroupTextarea,
};
