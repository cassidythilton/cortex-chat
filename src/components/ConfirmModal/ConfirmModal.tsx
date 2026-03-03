import { useEffect } from 'react';

import styles from './ConfirmModal.module.scss';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className={`${styles.modal} ${styles.isOpen}`}>
      <div className={styles.modalOverlay} onClick={handleOverlayClick}>
        <div
          className={styles.modalContainer}
          onClick={(e) => e.stopPropagation()}
        >
          <header className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>{title}</h2>
          </header>
          <main className={styles.modalContent}>
            <p className={styles.modalMessage}>{message}</p>
          </main>
          <footer className={styles.modalFooter}>
            <button onClick={onCancel} className={styles.cancelButton}>
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={
                variant === 'danger'
                  ? styles.dangerButton
                  : styles.confirmButton
              }
            >
              {confirmText}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
