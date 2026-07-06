import React from 'react';
import { AnimatePresence } from 'motion/react';
import type { Instance } from '../../services/api';
import MediaSendModal from './whatsapp/MediaSendModal';
import LocationSendModal from './whatsapp/LocationSendModal';
import ContactSendModal from './whatsapp/ContactSendModal';
import PollSendModal from './whatsapp/PollSendModal';
import ListSendModal from './whatsapp/ListSendModal';
import ReactionPicker from './whatsapp/ReactionPicker';

interface ChatPanelModalsProps {
  activeInstance: Instance | undefined;
  selectedPhone: string;
  showMediaModal: boolean;
  showLocationModal: boolean;
  showContactModal: boolean;
  showPollModal: boolean;
  showListModal: boolean;
  reactionTarget: { messageId: string; position: { x: number; y: number } } | null;
  onCloseMedia: () => void;
  onCloseLocation: () => void;
  onCloseContact: () => void;
  onClosePoll: () => void;
  onCloseList: () => void;
  onCloseReaction: () => void;
  onTokenDeduct: (cost: number) => void;
}

export default function ChatPanelModals({
  activeInstance, selectedPhone,
  showMediaModal, showLocationModal, showContactModal, showPollModal, showListModal, reactionTarget,
  onCloseMedia, onCloseLocation, onCloseContact, onClosePoll, onCloseList, onCloseReaction, onTokenDeduct
}: ChatPanelModalsProps) {
  return (
    <AnimatePresence>
      {showMediaModal && activeInstance && (
        <MediaSendModal instance={activeInstance} to={selectedPhone} onClose={onCloseMedia} onSend={onTokenDeduct} />
      )}
      {showLocationModal && activeInstance && (
        <LocationSendModal instance={activeInstance} to={selectedPhone} onClose={onCloseLocation} onSend={onTokenDeduct} />
      )}
      {showContactModal && activeInstance && (
        <ContactSendModal instance={activeInstance} to={selectedPhone} onClose={onCloseContact} onSend={onTokenDeduct} />
      )}
      {showPollModal && activeInstance && (
        <PollSendModal instance={activeInstance} to={selectedPhone} onClose={onClosePoll} onSend={onTokenDeduct} />
      )}
      {showListModal && activeInstance && (
        <ListSendModal instance={activeInstance} to={selectedPhone} onClose={onCloseList} onSend={onTokenDeduct} />
      )}
      {reactionTarget && activeInstance && (
        <ReactionPicker
          instance={activeInstance}
          to={selectedPhone}
          messageId={reactionTarget.messageId}
          position={reactionTarget.position}
          onClose={onCloseReaction}
          onSelect={onTokenDeduct}
        />
      )}
    </AnimatePresence>
  );
}
