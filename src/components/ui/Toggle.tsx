interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
  title: string;
  description?: string;
}

export function Toggle({ enabled, onChange, title, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-theme-primary">{title}</p>
        {description && (
          <p className="text-xs text-theme-muted">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={onChange}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 ring-accent focus:ring-offset-2
          ${enabled ? 'bg-accent' : 'bg-theme-tertiary'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0
            transition duration-200 ease-in-out
            ${enabled ? 'translate-x-5' : 'translate-x-0.5'}
            mt-0.5
          `}
        />
      </button>
    </div>
  );
}
