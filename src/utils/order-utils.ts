// Genera un string con los títulos de los productos de la orden y su cantidad, separados por un salto de línea
export function getOrderProductTitles(orderItems: any[]): string {
    return orderItems.map(item => `${item.product.title} x${item.quantity}`).join('\n');
}