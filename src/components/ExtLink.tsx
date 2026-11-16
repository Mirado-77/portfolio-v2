import type { ReactNode } from "react";

/** External link that tells assistive tech it opens a new tab (RGAA 6.1 / 13.2). */
export default function ExtLink({ href, children, className = "", style }: { href: string; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className} style={style}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
