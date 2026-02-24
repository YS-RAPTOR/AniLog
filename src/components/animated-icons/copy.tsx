import { Check, Copy as CopyIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type CopyProps = {
    copied: boolean;
    size?: "sm" | "md";
};

export function Copy({ copied, size = "md" }: CopyProps) {
    const iconClass = size === "sm" ? "size-4" : "size-5";

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            {copied ? (
                <motion.div
                    key="check"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.15 }}
                >
                    <Check className={iconClass} />
                </motion.div>
            ) : (
                <motion.div
                    key="copy"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.15 }}
                >
                    <CopyIcon className={iconClass} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
