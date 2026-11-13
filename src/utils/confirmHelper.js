/**
 * Shared confirmation helper that supports `useConfirmModal`'s `askConfirm`
 * (either callback-based `onConfirm`/`onCancel` or Promise-returning) and falls
 * back to `window.confirm` when no modal hook is passed.
 */
export async function confirmWithModal(
  askConfirm,
  {
    title = 'ยืนยันการทำรายการ',
    message = '',
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    variant = 'info'
  } = {}
) {
  if (typeof askConfirm === 'function') {
    return await new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (!settled) {
          settled = true;
          resolve(Boolean(value));
        }
      };
      try {
        const res = askConfirm({
          title,
          message,
          confirmText,
          cancelText,
          variant,
          onConfirm: () => finish(true),
          onCancel: () => finish(false)
        });
        if (res && typeof res.then === 'function') {
          res.then((v) => finish(Boolean(v))).catch(() => finish(false));
        }
      } catch (err) {
        console.error('confirmWithModal error:', err);
        finish(false);
      }
    });
  }
  return window.confirm([title, message].filter(Boolean).join('\n'));
}
