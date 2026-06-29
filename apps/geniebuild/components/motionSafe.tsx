import React, { useEffect, useState } from 'react';

type MotionDivProps = React.ComponentProps<'div'> & {
  children?: React.ReactNode;
  initial?: object;
  animate?: object;
  whileInView?: object;
  viewport?: object;
  transition?: object;
  /** GenieBuild builder only. Live site (readOnly) must pass false. */
  enabled?: boolean;
};

function stripMotionProps(props: MotionDivProps) {
  const {
    initial: _i,
    animate: _a,
    whileInView: _w,
    viewport: _v,
    transition: _t,
    enabled: _e,
    ...divProps
  } = props;
  return divProps;
}

/**
 * Safe animation wrapper — plain <div> on SiteNextJS / readOnly renders.
 * Motion loads only in the builder when enabled=true (client-side).
 */
export function AnimatedDiv({ enabled = false, children, ...props }: MotionDivProps) {
  const [MotionDiv, setMotionDiv] = useState<React.ComponentType<MotionDivProps> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setMotionDiv(null);
      return;
    }
    let cancelled = false;
    import('motion/react')
      .then((mod) => {
        if (!cancelled) setMotionDiv(() => mod.motion.div as React.ComponentType<MotionDivProps>);
      })
      .catch(() => {
        if (!cancelled) setMotionDiv(null);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled || !MotionDiv) {
    return <div {...stripMotionProps(props)}>{children}</div>;
  }

  return <MotionDiv {...props}>{children}</MotionDiv>;
}
