/**
 * SSR-safe stub for `motion/react` on SiteNextJS.
 * Webpack aliases `motion/react` → this file so live site never needs the real Motion runtime.
 */
import React from 'react';

type MotionStubProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
  initial?: unknown;
  animate?: unknown;
  whileInView?: unknown;
  viewport?: unknown;
  transition?: unknown;
};

function createMotionComponent(tag: string) {
  const MotionComponent = React.forwardRef<HTMLElement, MotionStubProps>(function MotionStub(
    { children, initial: _i, animate: _a, whileInView: _w, viewport: _v, transition: _t, ...rest },
    ref
  ) {
    return React.createElement(tag, { ...rest, ref }, children);
  });
  MotionComponent.displayName = `motion.${tag}`;
  return MotionComponent;
}

const componentCache: Record<string, ReturnType<typeof createMotionComponent>> = {};

export const motion = new Proxy({} as Record<string, ReturnType<typeof createMotionComponent>>, {
  get(_target, prop: string) {
    if (prop === 'then' || prop === '$$typeof') return undefined;
    if (!componentCache[prop]) {
      const tag = typeof prop === 'string' && /^[a-z][a-z0-9-]*$/i.test(prop) ? prop : 'div';
      componentCache[prop] = createMotionComponent(tag);
    }
    return componentCache[prop];
  },
});
