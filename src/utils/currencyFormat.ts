export const currencyFormat = (value: number) => {
    // es-AR usa '.' para miles y ',' para decimales; formateamos como número y anteponemos el símbolo $
    const formatted = new Intl.NumberFormat('es-AR', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)

    return `$${formatted}`
}