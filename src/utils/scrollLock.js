/**
 * Scroll Lock Utility & Hook
 * Prevents background page scrolling when modals, popups, or drawers are open.
 * Handles multiple concurrent modals cleanly with reference counting and prevents scrollbar jitter.
 */
import { useEffect } from 'react';

let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';
let originalBodyPaddingRight = '';

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;

  lockCount++;
  if (lockCount === 1) {
    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;

    // Prevent layout shift from scrollbar disappearing
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('modal-scroll-locked');
    document.documentElement.classList.add('modal-scroll-locked');
  }
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalBodyOverflow || '';
    document.documentElement.style.overflow = originalHtmlOverflow || '';
    document.body.style.paddingRight = originalBodyPaddingRight || '';
    document.body.classList.remove('modal-scroll-locked');
    document.documentElement.classList.remove('modal-scroll-locked');
  }
}

export function forceUnlockAll() {
  if (typeof document === 'undefined') return;
  lockCount = 0;
  document.body.style.overflow = originalBodyOverflow || '';
  document.documentElement.style.overflow = originalHtmlOverflow || '';
  document.body.style.paddingRight = originalBodyPaddingRight || '';
  document.body.classList.remove('modal-scroll-locked');
  document.documentElement.classList.remove('modal-scroll-locked');
}

/**
 * React Hook to lock/unlock body scroll based on an open/close condition
 * @param {boolean} isOpen
 */
export function useBodyScrollLock(isOpen = true) {
  useEffect(() => {
    if (!isOpen) return;

    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);
}
