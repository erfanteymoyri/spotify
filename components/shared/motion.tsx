"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Shared entrance-animation primitives built on the motion library */

const EASE = [0.25, 0.4, 0.25, 1] as const;

interface MotionBlockProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Fade + slide-up on mount */
export function FadeIn({ children, className, delay = 0 }: MotionBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Parent that staggers its StaggerItem children on mount */
export function Stagger({ children, className }: MotionBlockProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: MotionBlockProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.5, ease: EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
