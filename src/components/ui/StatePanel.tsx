import type { ReactNode } from 'react'

interface StatePanelProps {
  children?: ReactNode
  description: ReactNode
  eyebrow: string
  icon: ReactNode
  title: string
  tone?: 'default' | 'destructive'
}

export default function StatePanel({
  children,
  description,
  eyebrow,
  icon,
  title,
  tone = 'default',
}: StatePanelProps) {
  const iconTone = tone === 'destructive'
    ? 'bg-destructive/10 text-destructive border-destructive/25'
    : 'bg-primary/20 text-accent border-accent/25'

  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.18),transparent_34rem)]" />
      <div className="relative mx-auto max-w-2xl rounded-xl border border-border/60 bg-card/90 p-7 text-center shadow-2xl shadow-background/40 backdrop-blur sm:p-10">
        <div className={`mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border text-2xl ${iconTone}`}>
          {icon}
        </div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h1>{title}</h1>
        <div className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </div>
        {children && <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">{children}</div>}
      </div>
    </section>
  )
}
