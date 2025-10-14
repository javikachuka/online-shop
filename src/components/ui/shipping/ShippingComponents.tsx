import { currencyFormat } from '@/utils';

interface ShippingBadgeProps {
  freeShipping: boolean;
  progressToFreeShipping: number;
  freeShippingThreshold: number;
}

export const ShippingBadge = ({ 
  freeShipping, 
  progressToFreeShipping, 
  freeShippingThreshold 
}: ShippingBadgeProps) => {
  
  if (freeShipping) {
    return (
      <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm font-semibold">
        🚚 ¡Envío GRATIS!
      </div>
    );
  }

  const progressPercent = Math.min(100, 
    ((freeShippingThreshold - progressToFreeShipping) / freeShippingThreshold) * 100
  );

  return (
    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
      <div className="text-sm text-blue-800 mb-2">
        Agrega {currencyFormat(progressToFreeShipping)} más para envío gratis
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

interface ShippingInfoProps {
  shippingCost: number;
  freeShipping: boolean;
  method?: string;
  deliveryMethod?: 'delivery' | 'pickup';
}

export const ShippingInfo = ({ 
  shippingCost, 
  freeShipping, 
  method = 'standard',
  deliveryMethod = 'delivery'
}: ShippingInfoProps) => {
  
  // Determinar el texto a mostrar según el método de entrega
  const getDisplayText = () => {
    if (deliveryMethod === 'pickup') {
      return 'Retiro en local';
    }
    return `Envío ${method === 'express' ? 'Express' : 'Estándar'}`;
  };
  
  return (
    <>
      <span className="flex items-center">
        {getDisplayText()}
      </span>
      <span className={freeShipping || deliveryMethod === 'pickup' ? 'text-right text-green-600 font-semibold' : 'text-right'}>
        {deliveryMethod === 'pickup' || freeShipping ? '¡Gratis!' : currencyFormat(shippingCost)}
      </span>
    </>
  );
};