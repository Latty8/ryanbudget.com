export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="page-header space-y-3">
      {eyebrow ? <p className="type-eyebrow">{eyebrow}</p> : null}
      <h1 className="max-w-3xl text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--foreground)]">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-[1.0625rem] leading-[1.5] tracking-[-0.022em] text-[var(--muted)]">
          {description}
        </p>
      ) : null}
    </header>
  );
}

export function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`mb-4 text-[1.375rem] font-semibold tracking-[-0.03em] text-[var(--foreground)] ${className}`}
    >
      {children}
    </h2>
  );
}
