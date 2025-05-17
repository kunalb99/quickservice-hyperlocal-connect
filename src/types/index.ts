
export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  category: string;
  rating: number;
  distance: number; // in kilometers
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  phone: string;
  confirmed?: boolean;
  confirmationMessage?: string;
}

export type ProviderType = "product" | "service";

export interface Request {
  id: string;
  query: string;
  category: string;
  type: ProviderType;
  timestamp: number;
  status: RequestStatus;
  providers: Provider[];
}

export type RequestStatus = "pending" | "active" | "completed" | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: number;
  type: ProviderType;
}

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at?: string;
  updated_at?: string;
};

export type ProviderProduct = {
  provider_id: string;
  product_id: string;
  in_stock: boolean;
  price?: number;
};
