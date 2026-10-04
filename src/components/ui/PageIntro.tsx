import type { ReactNode } from 'react'

interface PageIntroProps {
  actions?: ReactNode
  description: ReactNode
  eyebrow: string
  title: ReactNode
}

export default function PageIntro({ actions, description, eyebrow, title }: PageIntroProps) {
  return (
    <header className="relative overflow-hidden rounded-xl border border-border/60 bg-card/90 p-6 shadow-xl shadow-background/20 sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-accent/15 shadow-[0_0_0_42px_hsl(var(--primary)/0.08),0_0_0_84px_hsl(var(--primary)/0.05)]" />
      <div className="relative max-w-4xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
        <h1>{title}</h1>
        <div className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          {description}
        </div>
        {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  )
}
