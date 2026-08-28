// Deduplicación cliente del evento `purchase` por orden, persistente entre refrescos/tabs.
const PURCHASE_KEY_PREFIX = 'ga_purchase_';

export const hasTrackedPurchase = (orderId: string): boolean => {
  if (typeof window === 'undefined') return true;

  try {
    return window.localStorage.getItem(`${PURCHASE_KEY_PREFIX}${orderId}`) === '1';
  } catch {
    return false;
  }
};

export const markPurchaseTracked = (orderId: string): void => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(`${PURCHASE_KEY_PREFIX}${orderId}`, '1');
  } catch {
    // Ignorar errores de almacenamiento (ej. modo privado con cuota agotada)
  }
};
