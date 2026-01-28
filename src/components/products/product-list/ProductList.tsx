'use client';

import Link from 'next/link';
import Image from 'next/image';
import { IoStarOutline } from 'react-icons/io5';
import { ProductImage } from '@/components/product/product-image/ProductImage';

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  minPrice: number;
  discountPercent: number;
  inStock: boolean;
  ProductImage?: { url: string }[];
}

interface Props {
  products: Product[];
}

export const ProductList = ({ products }: Props) => {
    
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg border hover:shadow-md transition-shadow">
          <Link href={`/product/${product.slug}`}>
            <div className="flex gap-4 p-4">
              {/* Imagen del producto */}
              <div className="flex-shrink-0">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                  <ProductImage
                    src={product.ProductImage?.[0]?.url}
                    alt={product.title}
                    className="object-cover rounded-lg"
                  />
                  {product.discountPercent > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      -{product.discountPercent}%
                    </div>
                  )}
                </div>
              </div>

              {/* Información del producto */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      maxHeight: '3rem'
                    }}>
                      {product.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      maxHeight: '2.5rem'
                    }}>
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {/* Precio */}
                      <div className="flex items-center gap-2">
                        {product.discountPercent > 0 ? (
                          <>
                            <span className="text-xl font-bold text-gray-900">
                              ${(product.minPrice * (1 - product.discountPercent / 100)).toFixed(0)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ${product.minPrice.toFixed(0)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-gray-900">
                            ${product.minPrice.toFixed(0)}
                          </span>
                        )}
                      </div>

                      {/* Estado de stock */}
                      <div className="mt-1">
                        {product.inStock ? (
                          <span className="text-green-600 text-sm font-medium">
                            En stock
                          </span>
                        ) : (
                          <span className="text-red-600 text-sm font-medium">
                            Sin stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Calificación placeholder */}
                    {/* <div className="flex items-center gap-1 text-yellow-400">
                      <IoStarOutline className="w-4 h-4" />
                      <span className="text-sm text-gray-600">4.5</span>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};