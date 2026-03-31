"use client";

import { cn } from "@/lib/utils";
import {
  motion,
  useInView,
  useMotionTemplate,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import React, { createContext, useContext, useRef } from "react";

// --- Spring config ---
const springConfig = { stiffness: 100, damping: 16, mass: 0.75 };

// --- ContainerScroll ---
type ScrollContextValue = {
  scrollYProgress: MotionValue<number>;
};

const ScrollContext = createContext<ScrollContextValue | null>(null);

export function useContainerScroll() {
  return useContext(ScrollContext);
}

type ContainerScrollProps = {
  children: React.ReactNode;
  className?: string;
};

export function ContainerScroll({ children, className }: ContainerScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <ScrollContext.Provider value={{ scrollYProgress }}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </ScrollContext.Provider>
  );
}

// --- ContainerStagger ---
type ContainerStaggerProps = {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
};

export function ContainerStagger({
  children,
  stagger = 0.1,
  className,
}: ContainerStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
          _staggerDelay: index * stagger,
          _isInView: isInView,
        });
      })}
    </div>
  );
}

// --- ContainerAnimated ---
type AnimationType = "left" | "right" | "top" | "bottom" | "z" | "blur";

type ContainerAnimatedProps = {
  children: React.ReactNode;
  animation?: AnimationType;
  className?: string;
  _staggerDelay?: number;
  _isInView?: boolean;
};

function getInitialAndAnimate(animation?: AnimationType) {
  const distance = 40;

  switch (animation) {
    case "left":
      return { initial: { opacity: 0, x: -distance }, animate: { opacity: 1, x: 0 } };
    case "right":
      return { initial: { opacity: 0, x: distance }, animate: { opacity: 1, x: 0 } };
    case "top":
      return { initial: { opacity: 0, y: -distance }, animate: { opacity: 1, y: 0 } };
    case "bottom":
      return { initial: { opacity: 0, y: distance }, animate: { opacity: 1, y: 0 } };
    case "z":
      return { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } };
    case "blur":
      return {
        initial: { opacity: 0, filter: "blur(10px)" },
        animate: { opacity: 1, filter: "blur(0px)" },
      };
    default:
      return { initial: { opacity: 0 }, animate: { opacity: 1 } };
  }
}

export function ContainerAnimated({
  children,
  animation,
  className,
  _staggerDelay = 0,
  _isInView,
}: ContainerAnimatedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const selfInView = useInView(ref, { once: true, margin: "-80px" });
  const isInView = _isInView !== undefined ? _isInView : selfInView;

  const { initial, animate } = getInitialAndAnimate(animation);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={isInView ? animate : initial}
      transition={{
        type: "spring",
        ...springConfig,
        delay: _staggerDelay,
      }}
    >
      {children}
    </motion.div>
  );
}

// --- ContainerInset ---
type ContainerInsetProps = {
  children: React.ReactNode;
  className?: string;
};

export function ContainerInset({ children, className }: ContainerInsetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const insetValue = useTransform(scrollYProgress, [0, 1], [40, 0]);
  const roundValue = useTransform(scrollYProgress, [0, 1], [24, 2]);
  const opacityValue = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  const clipInset = useMotionTemplate`inset(${insetValue}% ${insetValue}% ${insetValue}% ${insetValue}% round ${roundValue}px)`;

  return (
    <motion.div
      ref={ref}
      className={cn("will-change-transform", className)}
      style={{
        clipPath: clipInset,
        opacity: opacityValue,
      }}
    >
      {children}
    </motion.div>
  );
}
