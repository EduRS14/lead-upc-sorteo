import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'quiet';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  const sizeClass =
    size === 'lg' ? 'px-8 py-4 text-base' : size === 'sm' ? 'px-3 py-1.5 text-xs' : '';
  const variantClass =
    variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : 'btn-ghost bg-transparent';
  return <button className={`btn ${variantClass} ${sizeClass} ${className}`} {...rest} />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function Pill({
  children,
  tone = 'ticket',
}: {
  children: ReactNode;
  tone?: 'ticket' | 'warn' | 'danger' | 'ok';
}) {
  const map = {
    ticket: 'pill-ticket',
    warn: 'pill-warn',
    danger: 'pill-danger',
    ok: 'pill-ok',
  } as const;
  return <span className={`pill ${map[tone]}`}>{children}</span>;
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="card-tight px-4 py-3">
      <div className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-lilac">{label}</div>
      <div className="mt-1 text-2xl font-extrabold leading-none">{value}</div>
      {hint ? <div className="mt-1 text-xs text-lilac/70">{hint}</div> : null}
    </div>
  );
}

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <img
      src="/brand/lead-upc.jpg"
      alt="LEAD UPC"
      width={size}
      height={size}
      className="rounded-2xl border border-white/15 object-cover shadow-lg shadow-black/30"
      style={{ width: size, height: size }}
    />
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">{children}</h2>
      {hint ? <p className="mt-1 text-xs text-lilac">{hint}</p> : null}
    </div>
  );
}
