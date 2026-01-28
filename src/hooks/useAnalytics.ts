'use client';

import { useCallback } from 'react';

export const useAnalytics = () => {
  const trackEvent = useCallback((eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  }, []);

  const trackPageView = useCallback((url: string, title?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!, {
        page_path: url,
        page_title: title,
      });
    }
  }, []);

  const trackPurchase = useCallback((transactionData: {
    transaction_id: string;
    value: number;
    currency: string;
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      quantity: number;
      price: number;
    }>;
  }) => {
    trackEvent('purchase', transactionData);
  }, [trackEvent]);

  const trackAddToCart = useCallback((itemData: {
    currency: string;
    value: number;
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      quantity: number;
      price: number;
    }>;
  }) => {
    trackEvent('add_to_cart', itemData);
  }, [trackEvent]);

  const trackViewItem = useCallback((itemData: {
    currency: string;
    value: number;
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      price: number;
    }>;
  }) => {
    trackEvent('view_item', itemData);
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackPurchase,
    trackAddToCart,
    trackViewItem,
  };
};