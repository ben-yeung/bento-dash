import '@testing-library/dom';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// Mock motion/react so AnimatePresence renders children directly in JSDOM tests.
// Without this, AnimatePresence mode="wait" holds the exiting component alive
// indefinitely (no real animation engine), blocking the entering component.
vi.mock('motion/react', async (importOriginal: () => Promise<object>) => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  // Strip motion-specific props before forwarding to the real DOM element.
  const MOTION_PROPS = new Set([
    'initial', 'animate', 'exit', 'variants', 'transition',
    'layout', 'layoutId', 'layoutDependency',
    'whileHover', 'whileTap', 'whileFocus', 'whileDrag', 'whileInView',
    'onAnimationStart', 'onAnimationComplete', 'onUpdate',
    'drag', 'dragConstraints', 'dragElastic', 'dragMomentum',
    'transformTemplate', 'custom',
  ]);

  function createMotionComponent(tag: string) {
    const Component = React.forwardRef(function MotionStub(
      { children, ...props }: React.PropsWithChildren<Record<string, unknown>>,
      ref: React.ForwardedRef<unknown>,
    ) {
      const domProps: Record<string, unknown> = { ref };
      for (const [k, v] of Object.entries(props)) {
        if (!MOTION_PROPS.has(k)) domProps[k] = v;
      }
      return React.createElement(tag, domProps, children);
    });
    Component.displayName = `motion.${tag}`;
    return Component;
  }

  const motion = new Proxy({} as Record<string, unknown>, {
    get(_: Record<string, unknown>, tag: string) {
      return createMotionComponent(tag);
    },
  });

  return {
    ...actual,
    motion,
    // Render children directly — no deferred mounting, no exit waiting.
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    LayoutGroup: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});
