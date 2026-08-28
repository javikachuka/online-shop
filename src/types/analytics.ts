// Tipos GA4 reutilizables para el embudo de e-commerce.
// No incluir aquí PII (nombres, emails, teléfonos, direcciones, tokens, datos de pago).

export interface GaItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
}

export interface GaPurchaseEvent {
  transaction_id: string;
  value: number;
  currency: 'ARS';
  shipping?: number;
  tax?: number;
  coupon?: string;
  items: GaItem[];
}

export interface GaViewItemEvent {
  currency: 'ARS';
  value: number;
  items: GaItem[];
}

export interface GaCartEvent {
  currency: 'ARS';
  value: number;
  items: GaItem[];
}

export interface GaShippingInfoEvent {
  currency: 'ARS';
  value: number;
  shipping_tier?: string;
  items: GaItem[];
}

export interface GaPaymentInfoEvent {
  currency: 'ARS';
  value: number;
  payment_type: 'mercado_pago';
  items: GaItem[];
}

export interface GaLeadEvent {
  lead_type: 'whatsapp';
  page_path: string;
  item_id?: string;
}

export interface GaSearchEvent {
  search_term: string;
  results_count?: number;
}

// DTO de analytics de una orden confirmada por backend (sin datos sensibles),
// usado para disparar `purchase` sin depender del carrito local.
export interface OrderAnalyticsSummary {
  orderId: string;
  value: number;
  shipping?: number;
  tax?: number;
  coupon?: string;
  items: GaItem[];
}
