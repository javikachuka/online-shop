'use client';

import { useCallback } from 'react';
import {
  GaCartEvent,
  GaLeadEvent,
  GaPaymentInfoEvent,
  GaPurchaseEvent,
  GaSearchEvent,
  GaShippingInfoEvent,
  GaViewItemEvent,
} from '@/types/analytics';

type GaEventParams = Record<string, unknown>;

export const useAnalytics = () => {
  const trackEvent = useCallback(<T extends object>(eventName: string, parameters?: T) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters as GaEventParams | undefined);
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

  const trackPurchase = useCallback((payload: GaPurchaseEvent) => {
    trackEvent('purchase', payload);
  }, [trackEvent]);

  const trackAddToCart = useCallback((payload: GaCartEvent) => {
    trackEvent('add_to_cart', payload);
  }, [trackEvent]);

  const trackRemoveFromCart = useCallback((payload: GaCartEvent) => {
    trackEvent('remove_from_cart', payload);
  }, [trackEvent]);

  const trackViewItem = useCallback((payload: GaViewItemEvent) => {
    trackEvent('view_item', payload);
  }, [trackEvent]);

  const trackViewCart = useCallback((payload: GaCartEvent) => {
    trackEvent('view_cart', payload);
  }, [trackEvent]);

  const trackBeginCheckout = useCallback((payload: GaCartEvent) => {
    trackEvent('begin_checkout', payload);
  }, [trackEvent]);

  const trackAddShippingInfo = useCallback((payload: GaShippingInfoEvent) => {
    trackEvent('add_shipping_info', payload);
  }, [trackEvent]);

  const trackAddPaymentInfo = useCallback((payload: GaPaymentInfoEvent) => {
    trackEvent('add_payment_info', payload);
  }, [trackEvent]);

  const trackGenerateLead = useCallback((payload: GaLeadEvent) => {
    trackEvent('generate_lead', payload);
  }, [trackEvent]);

  const trackSearch = useCallback((payload: GaSearchEvent) => {
    trackEvent('search', payload);
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackPurchase,
    trackAddToCart,
    trackRemoveFromCart,
    trackViewItem,
    trackViewCart,
    trackBeginCheckout,
    trackAddShippingInfo,
    trackAddPaymentInfo,
    trackGenerateLead,
    trackSearch,
  };
};