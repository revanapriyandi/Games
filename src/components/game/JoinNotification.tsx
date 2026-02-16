import { motion, AnimatePresence } from "framer-motion";

interface JoinNotificationProps {
    notification: string | null;
}

export function JoinNotification({ notification }: JoinNotificationProps) {
    if (!notification) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600/90 text-white px-6 py-2 rounded-full shadow-lg border border-blue-400 font-bold backdrop-blur-md"
            >
                👋 {notification}
            </motion.div>
        </AnimatePresence>
    );
}
