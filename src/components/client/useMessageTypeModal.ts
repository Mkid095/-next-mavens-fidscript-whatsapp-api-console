import { useState } from 'react';

export type MessageType = 'media' | 'location' | 'contact' | 'poll' | 'list';

export function useMessageTypeModal() {
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  const openModal = (type: MessageType) => {
    if (type === 'media') setShowMediaModal(true);
    else if (type === 'location') setShowLocationModal(true);
    else if (type === 'contact') setShowContactModal(true);
    else if (type === 'poll') setShowPollModal(true);
    else if (type === 'list') setShowListModal(true);
  };

  return {
    showMediaModal, setShowMediaModal,
    showLocationModal, setShowLocationModal,
    showContactModal, setShowContactModal,
    showPollModal, setShowPollModal,
    showListModal, setShowListModal,
    openModal,
  };
}
