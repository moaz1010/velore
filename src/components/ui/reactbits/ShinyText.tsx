import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function ShinyText({ children }: Props) {
  return <span className="shiny-text">{children}</span>;
}
