export interface PaymentMethod{
    id: string;
    name: string;
    isEnabled: boolean;
    discountPercent: number|null;
    description: string|null;
    type: string|null;
    order: number|null;
}