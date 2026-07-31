import type { Instance } from '../../../services/api';

interface InstanceSwitcherProps {
  instances: Instance[];
  instance: Instance | null;
  onSwitch: (i: Instance) => void;
}

export default function InstanceSwitcher({ instances, instance, onSwitch }: InstanceSwitcherProps) {
  return (
    <select
      value={instance?.id ?? ''}
      onChange={(e) => {
        const found = instances.find((i) => i.id === e.target.value);
        if (found) onSwitch(found);
      }}
      className="appearance-none rounded-lg border border-[#2d2813] bg-[#1a1915] px-2.5 py-1.5 pr-7 text-xs text-[#a8a99e] outline-none focus:border-[#eab308]"
    >
      {instances.map((i) => (
        <option key={i.id} value={i.id} style={{ background: '#1a1915', color: '#a8a99e' }}>
          {i.name}{i.status === 'connected' ? ' · connected' : ''}
        </option>
      ))}
    </select>
  );
}
