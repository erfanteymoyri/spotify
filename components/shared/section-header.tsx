interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
