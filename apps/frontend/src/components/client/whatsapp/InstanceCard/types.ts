import type { Instance } from '../../../../services/api';

export interface InstanceCardProps {
  inst: Instance;
  onConnect: (inst: Instance) => void;
  onDisconnect: (inst: Instance) => void;
  onDelete: (inst: Instance) => void;
  onSettings: (inst: Instance) => void;
  onSyncGroups?: (inst: Instance) => void;
}
