import { initialData } from "./seed";
import prisma from '../lib/prisma'
import { countries } from "./seed-countries";


async function main() {


    await prisma.orderAddress.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()

    await prisma.userAddress.deleteMany()
    await prisma.country.deleteMany()
    await prisma.user.deleteMany()
    
    await prisma.productImage.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    const {categories, products, users} = initialData

    //Categorias


    await prisma.country.createMany({
        data: countries
    })

    await prisma.user.createMany({
        data: users
    })


    const categoriesData = categories.map((name) => ({name}));

    await prisma.category.createMany({
        data: categoriesData
    })

    const categoryDB = await prisma.category.findMany()

    const cateroriesMap = categoryDB.reduce((map, category) => {
        
        map[category.name.toLocaleLowerCase()] = category.id

        return map
    }, {} as Record<string, string>) // <string=shirt,string=categoryId>


    //products
    // const {images, type ,...product1} = products[0]

    // await prisma.product.create({
    //     data:{
    //         ...product1,
    //         categoryId: cateroriesMap['shirts']
    //     }
    // })

    products.forEach(async (product) => {
        const {type, images, ...rest} = product

        const dbProduct = await prisma.product.create({
            data:{
                ...rest,
                categoryId: cateroriesMap[type]
            }
        })

        //Images
        const imagesData = images.map(image => ({
            url: image,
            productId: dbProduct.id
        }))

        await prisma.productImage.createMany({
            data: imagesData
        })
    })


    
    
    
    console.log('seed finalizado');
    
    
}


(() => {
    if(process.env.NODE_ENV === 'production'){
        return;
    }
    main()
})()