import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../utils/scrollLock';

/**
 * ModalPortal
 * Renders modal content directly into document.body to prevent parent container
 * transforms/overflow clipping from distorting fixed positioning.
 * Automatically locks and unlocks background page scrolling.
 * Supports ESC key to close if onClose is provided.
 */
export default function ModalPortal({ children, isOpen = true, onClose }) {
  useBodyScrollLock(Boolean(isOpen));

  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-portal-wrapper">
      {children}
    </div>,
    document.body
  );
}
