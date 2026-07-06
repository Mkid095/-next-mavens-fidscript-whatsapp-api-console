import type { Instance } from '../../../../services/api';

export interface InstanceSettingsModalProps {
  inst: Instance;
  onClose: () => void;
}
