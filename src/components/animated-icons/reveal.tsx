import { Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type RevealProps = {
    visible: boolean;
};

export function Reveal({ visible }: RevealProps) {
    return (
        <AnimatePresence mode="popLayout" initial={false}>
            {visible ? (
                <motion.div
                    key="eye-off"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.15 }}
                >
                    <EyeOff className="size-5" />
                </motion.div>
            ) : (
                <motion.div
                    key="eye"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.15 }}
                >
                    <Eye className="size-5" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
