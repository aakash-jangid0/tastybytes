import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

// Spring config for Apple-style smooth animations
const appleSpring = { stiffness: 100, damping: 30, mass: 1 };

// --- FadeInOnScroll ---
interface FadeInOnScrollProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  delay?: number;
  once?: boolean;
}

export function FadeInOnScroll({
  children,
  className = '',
  direction = 'up',
  distance = 40,
  delay = 0,
  once = true,
}: FadeInOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-50px' });

  const directionMap = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  };

  const offset = directionMap[direction];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: offset.x, y: offset.y }}
      transition={{
        type: 'spring',
        ...appleSpring,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- ParallaxSection ---
interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // 0 = no parallax, 1 = full parallax. Default 0.3
  style?: React.CSSProperties;
}

export function ParallaxSection({
  children,
  className = '',
  speed = 0.3,
  style,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rawY = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100]);
  const y = useSpring(rawY, { stiffness: 100, damping: 30, mass: 0.5 });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={style}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}

// --- ScaleReveal ---
interface ScaleRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

export function ScaleReveal({
  children,
  className = '',
  delay = 0,
  once = true,
}: ScaleRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
      transition={{
        type: 'spring',
        ...appleSpring,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- StaggerChildren ---
interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

const staggerContainerVariants = (staggerDelay: number) => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      ...appleSpring,
    },
  },
};

export function StaggerChildren({
  children,
  className = '',
  staggerDelay = 0.1,
  once = true,
}: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-30px' });

  return (
    <motion.div
      ref={ref}
      variants={staggerContainerVariants(staggerDelay)}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- HeroParallax: scroll-linked fade-out + translate for hero text ---
interface HeroParallaxProps {
  children: React.ReactNode;
  className?: string;
}

export function HeroParallax({ children, className = '' }: HeroParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const rawOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const rawY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);
  const rawScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const opacity = useSpring(rawOpacity, { stiffness: 100, damping: 30 });
  const y = useSpring(rawY, { stiffness: 100, damping: 30 });
  const scale = useSpring(rawScale, { stiffness: 100, damping: 30 });

  return (
    <motion.div ref={ref} style={{ opacity, y, scale }} className={className}>
      {children}
    </motion.div>
  );
}
