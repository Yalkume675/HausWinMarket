
import { api, API_URL } from './client';
import { HttpError } from './errors';

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  brand: string;
  thumbnail: string;
  images: string[];
};

export type Category = {
  slug: string;
  name: string;
};

const FIELDS =
  'id,title,description,category,price,rating,stock,brand,thumbnail,images';

export function normalise(raw: any): Product {
  return {
    id: Number(raw?.id),
    title: String(raw?.title ?? 'Untitled'),
    description: String(raw?.description ?? ''),
    category: String(raw?.category ?? 'other'),
    price: Number(raw?.price ?? 0),
    rating: Number(raw?.rating ?? 0),
    stock: Number(raw?.stock ?? 0),
    brand: String(raw?.brand ?? ''),
    thumbnail: String(raw?.thumbnail ?? ''),
    images: Array.isArray(raw?.images)
      ? raw.images.map(String)
      : [],
  };
}

// READ products with axios
export async function getProducts(skip = 0, limit = 20) {
  const { data } = await api.get('/products', {
    params: { skip, limit, select: FIELDS },
  });

  return {
    products: (data?.products ?? []).map(normalise) as Product[],
    total: Number(data?.total ?? 0),
  };
}

export async function getProduct(id: number | string) {
  const { data } = await api.get(`/products/${id}`);
  return normalise(data);
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get('/products/categories');

  return (Array.isArray(data) ? data : []).map((c: any) => ({
    slug: String(c?.slug ?? c),
    name: String(c?.name ?? c),
  }));
}

// SEARCH products with fetch
export async function searchProducts(
  query: string,
  category: string | null
): Promise<Product[]> {
  const url = category
    ? `${API_URL}/products/category/${encodeURIComponent(category)}?limit=100`
    : `${API_URL}/products/search?q=${encodeURIComponent(query)}&limit=100`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new HttpError(res.status);
  }

  const json = await res.json();
  const products: Product[] = (json?.products ?? []).map(normalise);

  // Filter by text locally when a category is selected.
  if (category && query.trim()) {
    const q = query.trim().toLowerCase();

    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  return products;
}

// CREATE a product listing
export async function createProduct(input: {
  title: string;
  price: number;
  category: string;
  description: string;
  thumbnail?: string | null;
}) {
  const { data } = await api.post('/products/add', input);
  return normalise(data);
}

// PLACE an order
export async function placeOrder(
  userId: number,
  items: { id: number; quantity: number }[]
) {
  const { data } = await api.post('/carts/add', {
    userId,
    products: items,
  });

  return {
    id: Number(data?.id ?? 0),
    total: Number(data?.discountedTotal ?? data?.total ?? 0),
    totalQuantity: Number(data?.totalQuantity ?? 0),
  };
}
