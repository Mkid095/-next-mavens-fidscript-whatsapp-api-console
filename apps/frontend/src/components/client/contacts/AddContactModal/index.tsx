import React from 'react';
import AddContactForm from './AddContactForm';
import type { AddContactModalProps } from './types';

export default function AddContactModal({ onClose, onSaved, existingPhones }: AddContactModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
      <AddContactForm onClose={onClose} onSaved={onSaved} existingPhones={existingPhones} />
    </div>
  );
}
