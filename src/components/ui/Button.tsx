import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'dark' | 'danger' | 'nav-link';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-forest-500 text-white hover:bg-forest-600 shadow-soft hover:shadow-lift',
  gold: 'bg-gold-400 text-ink-900 hover:bg-gold-300 shadow-gold',
  outline: 'border border-ink-200 bg-white text-ink-800 hover:border-forest-500 hover:text-forest-600',
  ghost: 'text-ink-700 hover:bg-ink-100',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 shadow-soft',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  // Navbar utility link. Sits on the glass header, so it is flat until hover,
  // then a small white pill lifts. The size/gap/rounded utilities repeat what
  // the 'md' size supplies because callers pass no size here; they are marked
  // important so they win against the size record, which cn() cannot resolve
  // (plain clsx, no tailwind-merge).
  'nav-link':
    '!h-auto !gap-1.5 !rounded-lg !border-0 !bg-transparent !px-3.5 !py-2 !text-sm !font-semibold ' +
    '!text-ink-700 !shadow-none !transition-[background-color,box-shadow] !duration-150 !ease-out ' +
    'hover:!bg-white hover:!text-ink-800 hover:!shadow-[0_2px_8px_rgba(0,0,0,0.08)] ' +
    'focus-visible:!bg-white focus-visible:!text-ink-800',
};

const sizes: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
  icon: 'h-11 w-11',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = 'Button';
