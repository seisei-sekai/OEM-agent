'use client';

import { FloatingButton } from './FloatingButton';
import { ChatModal } from './ChatModal';
import { useAIAgentStore } from '@/lib/store';

export function FloatingAIAgent() {
  const { isModalOpen, openModal, closeModal } = useAIAgentStore();

  return (
    <>
      {!isModalOpen && (
        <FloatingButton onClick={openModal} hasNotification />
      )}
      
      {isModalOpen && (
        <ChatModal onClose={closeModal} />
      )}
    </>
  );
}



