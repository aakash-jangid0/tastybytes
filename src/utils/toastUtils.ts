import { toast } from 'react-hot-toast';

// Default options for dismissible toasts
const defaultToastOptions = {
  style: {
    cursor: 'pointer',
    userSelect: 'none' as const,
    transition: 'all 0.2s ease',
  },
  duration: 3000,
};

// Enhanced toast utilities with consistent dismissible styling
export const toastUtils = {
  success: (message: string, options = {}) => {
    const toastId = toast.success(message, {
      ...defaultToastOptions,
      duration: 3000,
      style: {
        ...defaultToastOptions.style,
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534',
      },
      ...options,
    });
    
    // Add click handler after creation
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-hot-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.addEventListener('click', () => toast.dismiss(toastId));
      }
    }, 10);
    
    return toastId;
  },

  error: (message: string, options = {}) => {
    const toastId = toast.error(message, {
      ...defaultToastOptions,
      duration: 3000,
      style: {
        ...defaultToastOptions.style,
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
      },
      ...options,
    });
    
    // Add click handler after creation
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-hot-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.addEventListener('click', () => toast.dismiss(toastId));
      }
    }, 10);
    
    return toastId;
  },

  info: (message: string, options = {}) => {
    const toastId = toast(message, {
      ...defaultToastOptions,
      duration: 3000,
      icon: 'ℹ️',
      style: {
        ...defaultToastOptions.style,
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1d4ed8',
      },
      ...options,
    });
    
    // Add click handler after creation
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-hot-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.addEventListener('click', () => toast.dismiss(toastId));
      }
    }, 10);
    
    return toastId;
  },

  loading: (message: string, options = {}) => {
    const toastId = toast.loading(message, {
      ...defaultToastOptions,
      duration: 10000, // 10 seconds instead of Infinity
      style: {
        ...defaultToastOptions.style,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        color: '#475569',
      },
      ...options,
    });
    
    // Add click handler after creation for cancelling loading
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-hot-toast="${toastId}"]`);
      if (toastElement) {
        toastElement.addEventListener('click', () => toast.dismiss(toastId));
      }
    }, 10);
    
    return toastId;
  },

  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  },

  dismissAll: () => {
    return toast.dismiss();
  },

  // Quick dismissible variants
  quickSuccess: (message: string) => toastUtils.success(message, { duration: 2000 }),
  quickError: (message: string) => toastUtils.error(message, { duration: 3000 }),
  quickInfo: (message: string) => toastUtils.info(message, { duration: 2500 }),
};

// Helper to make any existing toast dismissible by click
export const makeDismissible = (toastFn: typeof toast.success | typeof toast.error) => {
  return (message: string, options = {}) => {
    const toastId = toastFn(message, {
      ...defaultToastOptions,
      ...options,
    });
    return toastId;
  };
};

export const setupGlobalToastDismiss = () => {
  let swipeStart: { id: string; x: number; y: number; pointerId: number } | undefined;

  const dismissToast = (id: string) => toast.dismiss(id);

  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const toastElement = target.closest<HTMLElement>('[data-hot-toast]');
    const toastId = toastElement?.dataset.hotToast;
    if (toastId) {
      dismissToast(toastId);
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const toastElement = target.closest<HTMLElement>('[data-hot-toast]');
    const toastId = toastElement?.dataset.hotToast;
    if (toastId) {
      swipeStart = {
        id: toastId,
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
      };
    }
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (!swipeStart || swipeStart.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    const isSwipe = Math.abs(deltaX) >= 50 || deltaY <= -50;
    if (isSwipe) {
      dismissToast(swipeStart.id);
      event.preventDefault();
      event.stopPropagation();
    }
    swipeStart = undefined;
  };

  const handlePointerCancel = () => {
    swipeStart = undefined;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      toast.dismiss();
    }
  };

  document.addEventListener('click', handleClick, true);
  document.addEventListener('pointerdown', handlePointerDown, true);
  document.addEventListener('pointerup', handlePointerUp, true);
  document.addEventListener('pointercancel', handlePointerCancel, true);
  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('pointerdown', handlePointerDown, true);
    document.removeEventListener('pointerup', handlePointerUp, true);
    document.removeEventListener('pointercancel', handlePointerCancel, true);
    document.removeEventListener('keydown', handleKeyDown);
  };
};

export default toastUtils;
