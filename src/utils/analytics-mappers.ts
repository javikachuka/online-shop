import { CartProduct, ProductVariant, ProductVariantAttribute } from '@/interfaces';
import { GaItem } from '@/types/analytics';
import { getNameAttributes } from './getNameAttributes';

const applyDiscount = (price: number, discountPercent?: number | null): number => {
  if (!discountPercent) return price;
  return +(price * (1 - discountPercent / 100)).toFixed(2);
};

const variantLabelFromAttributes = (attributes: ProductVariantAttribute[]): string | undefined => {
  const label = getNameAttributes(attributes);
  return label ? label : undefined;
};

export const cartProductToGaItem = (product: CartProduct): GaItem => ({
  item_id: product.variantId,
  item_name: product.title,
  item_variant: variantLabelFromAttributes(product.attributes),
  price: applyDiscount(product.price, product.discountPercent),
  quantity: product.quantity,
});

export const cartToGaItems = (cart: CartProduct[]): GaItem[] => cart.map(cartProductToGaItem);

export const cartToGaValue = (cart: CartProduct[]): number =>
  cart.reduce((total, product) => total + applyDiscount(product.price, product.discountPercent) * product.quantity, 0);

export const productVariantToGaItem = (productTitle: string, variant: ProductVariant, quantity = 1): GaItem => ({
  item_id: variant.id,
  item_name: productTitle,
  item_variant: variantLabelFromAttributes(variant.attributes),
  price: applyDiscount(variant.price, variant.discountPercent),
  quantity,
});
