import { Database } from '@/integrations/supabase/types';
import { Provider, ProviderType, RequestStatus, SearchHistory, Request, Product, ProviderProduct } from '@/types';

// Define types based on Supabase database tables
export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbProvider = Database['public']['Tables']['providers']['Row'];
export type DbRequest = Database['public']['Tables']['requests']['Row'];
export type DbRequestProvider = Database['public']['Tables']['request_providers']['Row'];
export type DbSearchHistory = Database['public']['Tables']['search_history']['Row'];

// We need to define these types for now since they don't exist in the Supabase types yet
export type DbProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at?: string;
  updated_at?: string;
};

export type DbProviderProduct = {
  provider_id: string;
  product_id: string;
  in_stock: boolean;
  price?: number;
  id: string;
  created_at?: string;
  updated_at?: string;
};

// Helper function to calculate distance between coordinates
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  // Simple distance calculation using the Haversine formula
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
};

// Helper function to convert Supabase geography point to lat/lng object
export const pointToLatLng = (point: string | null): { lat: number; lng: number } | null => {
  if (!point) return null;
  
  // Try to parse the geography point from Supabase
  try {
    // Format is typically POINT(lng lat)
    const match = point.match(/POINT\(([^ ]+) ([^)]+)\)/);
    if (match && match.length === 3) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);
      return { lat, lng };
    }
  } catch (error) {
    console.error('Error parsing geography point:', error);
  }
  
  return null;
};

// Convert Supabase provider to our application Provider type
export const mapDbProviderToProvider = (
  dbProvider: DbProvider,
  userLat?: number,
  userLng?: number
): Provider => {
  // Parse location from geography point
  const location = pointToLatLng(dbProvider.location as unknown as string) || { lat: 0, lng: 0 };
  
  // Calculate distance if user location is provided
  const distance = (userLat && userLng) 
    ? calculateDistance(userLat, userLng, location.lat, location.lng)
    : 0;
  
  return {
    id: dbProvider.id,
    name: dbProvider.name,
    type: dbProvider.type as ProviderType,
    category: dbProvider.category,
    rating: Number(dbProvider.rating) || 0,
    distance,
    location,
    address: dbProvider.address,
    phone: dbProvider.phone,
  };
};

// Convert Supabase search history to our application SearchHistory type
export const mapDbSearchHistoryToSearchHistory = (
  dbHistory: DbSearchHistory
): SearchHistory => {
  return {
    id: dbHistory.id,
    query: dbHistory.query,
    timestamp: new Date(dbHistory.timestamp).getTime(),
    type: dbHistory.type as ProviderType,
  };
};

// Convert Supabase request to our application Request type
export const mapDbRequestToRequest = (
  dbRequest: DbRequest, 
  providers: Provider[]
): Request => {
  return {
    id: dbRequest.id,
    query: dbRequest.query,
    category: dbRequest.category,
    type: dbRequest.type as ProviderType,
    timestamp: new Date(dbRequest.timestamp).getTime(),
    status: dbRequest.status as RequestStatus,
    providers,
  };
};

// New function to map DB product to application Product type
export const mapDbProductToProduct = (dbProduct: DbProduct): Product => {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    category: dbProduct.category,
    created_at: dbProduct.created_at,
    updated_at: dbProduct.updated_at,
  };
};

// New function to map DB provider product to application ProviderProduct type
export const mapDbProviderProductToProviderProduct = (dbProviderProduct: DbProviderProduct): ProviderProduct => {
  return {
    provider_id: dbProviderProduct.provider_id,
    product_id: dbProviderProduct.product_id,
    in_stock: dbProviderProduct.in_stock,
    price: dbProviderProduct.price,
  };
};
