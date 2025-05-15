
import { Provider, ProviderType, Request, SearchHistory, User } from "../types";

// Mock current user
export const currentUser: User = {
  id: "user-1",
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1234567890",
  location: {
    lat: 37.7749,
    lng: -122.4194,
  },
};

// Mock providers
export const mockProviders: Provider[] = [
  {
    id: "provider-1",
    name: "Quick Mart",
    type: "product",
    category: "grocery",
    rating: 4.5,
    distance: 0.7,
    location: {
      lat: 37.773,
      lng: -122.415,
    },
    address: "123 Market St, San Francisco, CA",
    phone: "+1234567891",
  },
  {
    id: "provider-2",
    name: "Fresh Foods",
    type: "product",
    category: "grocery",
    rating: 4.2,
    distance: 1.3,
    location: {
      lat: 37.776,
      lng: -122.419,
    },
    address: "456 Mission St, San Francisco, CA",
    phone: "+1234567892",
  },
  {
    id: "provider-3",
    name: "Corner Store",
    type: "product",
    category: "grocery",
    rating: 3.9,
    distance: 1.8,
    location: {
      lat: 37.77,
      lng: -122.413,
    },
    address: "789 Howard St, San Francisco, CA",
    phone: "+1234567893",
  },
  {
    id: "provider-4",
    name: "Bob's Plumbing",
    type: "service",
    category: "plumber",
    rating: 4.8,
    distance: 2.1,
    location: {
      lat: 37.772,
      lng: -122.409,
    },
    address: "101 Valencia St, San Francisco, CA",
    phone: "+1234567894",
  },
  {
    id: "provider-5",
    name: "City Plumbers",
    type: "service",
    category: "plumber",
    rating: 4.0,
    distance: 3.5,
    location: {
      lat: 37.78,
      lng: -122.42,
    },
    address: "202 Folsom St, San Francisco, CA",
    phone: "+1234567895",
  },
  {
    id: "provider-6",
    name: "24/7 Plumbing",
    type: "service",
    category: "plumber",
    rating: 4.6,
    distance: 4.2,
    location: {
      lat: 37.765,
      lng: -122.427,
    },
    address: "303 Divisadero St, San Francisco, CA",
    phone: "+1234567896",
  },
];

// Mock search history
export const mockSearchHistory: SearchHistory[] = [
  {
    id: "search-1",
    query: "milk",
    timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
    type: "product",
  },
  {
    id: "search-2",
    query: "plumber",
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    type: "service",
  },
];

// Mock active requests
export const mockRequests: Request[] = [
  {
    id: "request-1",
    query: "milk",
    category: "grocery",
    type: "product",
    timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    status: "active",
    providers: mockProviders.filter((p) => p.type === "product").map((p) => ({
      ...p,
      confirmed: p.id === "provider-1",
      confirmationMessage: p.id === "provider-1" ? "We have 3 Amul milk packets in stock." : undefined,
    })),
  },
];

// Utility function to filter providers by search query
export const filterProvidersByQuery = (query: string): { providers: Provider[], type: ProviderType } => {
  // Simplified logic: 
  // - "milk", "bread", "eggs", etc. are products (grocery)
  // - "plumber", "electrician", etc. are services
  
  const lowerQuery = query.toLowerCase();
  
  // Define product categories and their keywords
  const productKeywords = ["milk", "bread", "eggs", "cheese", "grocery", "food"];
  
  // Define service categories and their keywords
  const serviceKeywords = ["plumber", "electrician", "mechanic", "repair", "fix"];
  
  // Determine the type based on keyword
  let type: ProviderType = "product"; // default
  if (serviceKeywords.some(keyword => lowerQuery.includes(keyword))) {
    type = "service";
  }
  
  // Filter providers
  const filteredProviders = mockProviders.filter(provider => provider.type === type);
  
  return { providers: filteredProviders, type };
};

// Simulate provider responses
export const simulateProviderResponses = (providers: Provider[], type: ProviderType): Promise<Provider[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // For demonstration, randomly confirm 1-3 providers
      const updatedProviders = [...providers];
      const numConfirmations = Math.floor(Math.random() * 3) + 1; // 1 to 3 confirmations
      
      const indicesToConfirm = new Set<number>();
      while (indicesToConfirm.size < numConfirmations && indicesToConfirm.size < providers.length) {
        indicesToConfirm.add(Math.floor(Math.random() * providers.length));
      }
      
      indicesToConfirm.forEach(index => {
        updatedProviders[index].confirmed = true;
        
        if (type === "product") {
          updatedProviders[index].confirmationMessage = `We have ${Math.floor(Math.random() * 5) + 1} items in stock.`;
        } else {
          updatedProviders[index].confirmationMessage = "I'm available to help.";
        }
      });
      
      resolve(updatedProviders);
    }, 3000); // Simulate 3 second delay for responses
  });
};
