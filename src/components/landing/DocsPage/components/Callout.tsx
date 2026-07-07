export function Callout({
  children,
  type = 'info',
}: {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success';
}) {
  const colors = {
    info:    'border-blue-800 bg-blue-950/30 text-blue-300',
    warning: 'border-yellow-800 bg-yellow-950/30 text-yellow-200',
    success: 'border-green-800 bg-green-950/30 text-green-300',
  };

  return (
    <div className={`rounded-xl border p-4 text-xs leading-relaxed ${colors[type]}`}>
      {children}
    </div>
  );
}
