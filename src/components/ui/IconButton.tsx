import { type LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  label?: string;
  size?: number;
  className?: string;
}

export function IconButton({
  icon: Icon,
  onClick,
  label,
  size = 20,
  className = '',
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-full p-2 text-white/60 transition-colors
        hover:bg-white/10 hover:text-white
        focus:outline-none focus:ring-2 focus:ring-white/20
        ${className}
      `}
      aria-label={label}
      title={label}
    >
      <Icon size={size} />
    </button>
  );
}
