export function Callout({
  children,
  type = 'info',
}: {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success';
}) {
  const colors = {
    info:    'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-orange-200 bg-orange-50 text-orange-800',
    success: 'border-green-200 bg-green-50 text-green-800',
  };

  return (
    <div className={`rounded-xl border p-4 text-xs leading-relaxed ${colors[type]}`}>
      {children}
    </div>
  );
}
