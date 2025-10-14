


export const generatePaginationNumbers = (currentPage: number, totalPages: number) => {

    // total pages < 7 muestro todos sin puntos
    if(totalPages <= 7){
        return Array.from({length:totalPages}, (_, i) => i+1)
    }

    //si currentPage esta entre las 3 primeras paginas 
    //mostrar las 3 primeras puntos...

    if(currentPage <= 3){
        return [1,2,3,'...', totalPages-1, totalPages]
    }

    //si la pagina esta entre las ultimas 3 paginas
    if(currentPage >= totalPages - 2){
        return [1,2,'...', totalPages-2, totalPages-1, totalPages]
    }

    // si la pagina actual esta en otro lugar medio
    return [1, '...', currentPage-1,currentPage ,currentPage+1, '...', totalPages]

}