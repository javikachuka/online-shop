import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
const prisma = new PrismaClient();
import { countries } from "./seed-countries";


async function main() {

  // Eliminar datos existentes
  await prisma.orderItem.deleteMany();
  await prisma.orderAddress.deleteMany();
  await prisma.order.deleteMany();
  
  await prisma.userAddress.deleteMany();
  await prisma.user.deleteMany();
  await prisma.country.deleteMany();
  
  await prisma.productVariantAttribute.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.paymentMethod.deleteMany();
  
  //cargar paises
  await prisma.country.createMany({
        data: countries
  })


  // crear CATEGORÍAS
  
  // First, create categories if they don't exist, then fetch them by name to get their IDs
  // Crear categorías jerárquicas: Hombre y Mujer como padres, luego Indumentaria y Accesorios como hijos, y dentro de estos Pantalones y Remeras
  // 1. Crear categorías padre
  const hombre = await prisma.category.create({
    data: { 
      name: 'Hombre', 
      isEnabled: true, 
      slug: 'hombre',  
    }
  });
  const mujer = await prisma.category.create({
    data: { 
      name: 'Mujer', 
      isEnabled: true, 
      slug: 'mujer',  
    }
  });

  // 2. Crear subcategorías Indumentaria y Accesorios para cada padre
  const indumentariaHombre = await prisma.category.create({
    data: { 
      name: 'Indumentaria', 
      description: "indumentaria hombre", 
      isEnabled: true, 
      parentId: hombre.id,
      slug: 'indumentaria',
    }
  });
  const indumentariaMujer = await prisma.category.create({
    data: { 
      name: 'Indumentaria', 
      description: "indumentaria mujer", 
      isEnabled: true, 
      parentId: mujer.id,
      slug: 'indumentaria',
    }
  });

  // 3. Crear subcategorías Pantalones y Remeras dentro de Indumentaria y Accesorios
  await prisma.category.createMany({
    data: [
      // Indumentaria Hombre
      { 
        name: 'Pantalones', 
        description: "pantalones hombre", 
        isEnabled: true, 
        parentId: indumentariaHombre.id,
        slug: 'pantalones',
      },
      { 
        name: 'Remeras', 
        description: "remeras hombre", 
        isEnabled: true, 
        parentId: indumentariaHombre.id,
        slug: 'remeras',
      },
      // Indumentaria Mujer
      { 
        name: 'Pantalones', 
        description: "pantalones mujer", 
        isEnabled: true, 
        parentId: indumentariaMujer.id,
        slug: 'pantalones',
      },
      { 
        name: 'Remeras', 
        description: "remeras mujer", 
        isEnabled: true, 
        parentId: indumentariaMujer.id,
        slug: 'remeras',
      },
      // Puedes agregar más subcategorías si lo necesitas
    ],
    skipDuplicates: true
  });

  const categories = await prisma.category.findMany({
    where: {
      name: { in: ['Remeras', 'Pantalones', 'Shorts'] }
    }
  });

  // Crear ATRIBUTOS
  await prisma.attribute.createMany({
    data: [
      { name: 'Talle' },
      { name: 'Color' },
    ],
    skipDuplicates: true
  });

  const attributes = await prisma.attribute.findMany({
    where: {
      name: { in: ['Talle', 'Color'] }
    }
  });

  // Crear VALORES para cada atributo
  const talle = attributes.find(a => a.name === 'Talle');
  const color = attributes.find(a => a.name === 'Color');

  await prisma.attributeValue.createMany({
    data: [
      { value: 'S', attributeId: talle!.id },
      { value: 'M', attributeId: talle!.id },
      { value: 'L', attributeId: talle!.id },
      { value: 'Blanco', attributeId: color!.id },
      { value: 'Negro', attributeId: color!.id },
    ],
    skipDuplicates: true
  });

  const talleValues = await prisma.attributeValue.findMany({ where: { attributeId: talle!.id } });
  const colorValues = await prisma.attributeValue.findMany({ where: { attributeId: color!.id } });

  // Crear PRODUCTOS con VARIANTES usando valores de atributo
  const product = await prisma.product.create({
    data: {
      title: 'Remera básica',
      description: 'Remera de algodón premium',
      slug: 'remera-basica',
      tags: ['básico', 'algodón'],
      ProductImage: {
        create: [
          { url: '1740250-00-A_0_2000.jpg' },
          { url: '1740250-00-A_1.jpg' }
        ]
      },
      categories: {
        create: [
          { categoryId: categories[0].id }
        ]
      },
      variants: {
        create: [
          {
            price: 7500,
            stock: 10,
            sku: 'REM-S-BLANCO',
            attributes: {
              create: [
                { attributeId: talle!.id, valueId: talleValues.find(v => v.value === 'S')!.id },
                { attributeId: color!.id, valueId: colorValues.find(v => v.value === 'Blanco')!.id },
              ]
            }
          },
          {
            price: 7500,
            stock: 10,
            sku: 'REM-M-NEGRO',
            attributes: {
              create: [
                { attributeId: talle!.id, valueId: talleValues.find(v => v.value === 'M')!.id },
                { attributeId: color!.id, valueId: colorValues.find(v => v.value === 'Negro')!.id },
              ]
            }
          },
          {
            price: 7500,
            stock: 10,
            sku: 'REM-M-BLANCO',
            attributes: {
              create: [
                { attributeId: talle!.id, valueId: talleValues.find(v => v.value === 'M')!.id },
                { attributeId: color!.id, valueId: colorValues.find(v => v.value === 'Blanco')!.id },
              ]
            }
          },
          {
            price: 7800,
            stock: 8,
            sku: 'REM-L-NEGRO',
            attributes: {
              create: [
                { attributeId: talle!.id, valueId: talleValues.find(v => v.value === 'L')!.id },
                { attributeId: color!.id, valueId: colorValues.find(v => v.value === 'Negro')!.id },
              ]
            }
          },
        ]
      }
    }
  });

  // Crear MÉTODOS DE PAGO
  await prisma.paymentMethod.createMany({
    data: [
      {
        name: 'Mercado Pago',
        isEnabled: true,
        discountPercent: null,
        description: 'Pago online con Mercado Pago',
        type: 'online',
        order: 1,
      },
      {
        name: 'Transferencia bancaria',
        isEnabled: true,
        discountPercent: 10,
        description: 'Pago por transferencia bancaria. Recibí un 10% de descuento. El pedido dura hasta 12hs.',
        type: 'offline',
        order: 2,
      },
    ],
    skipDuplicates: true
  });

  // Crear USUARIOS
  await prisma.user.create({
    data: {
      email: 'test2@test2.com',
      firstName: 'test',
      lastName: 'usercito',
      password: bcryptjs.hashSync('12345678'),
      role: 'user'
    }
  });
  await prisma.user.create({
    data: {
      email: 'test@test.com',
      firstName: 'javi',
      lastName: 'vi',
      password: bcryptjs.hashSync('12345678'),
      role: 'admin'
    }
  });

  console.log('Seed completado.');
}


(() => {
    if(process.env.NODE_ENV === 'production'){
        return;
    }
    main()
      .catch(e => {
        console.error(e);
        process.exit(1);
      })
      .finally(async () => {
        await prisma.$disconnect();
      });
})()

