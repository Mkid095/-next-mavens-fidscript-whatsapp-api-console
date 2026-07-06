export interface AddContactModalProps {
  onClose: () => void;
  onSaved: (contact: { id: string; phone: string; name: string; created_at: string }) => void;
  existingPhones?: Set<string>;
}
