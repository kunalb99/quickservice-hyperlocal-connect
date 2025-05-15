
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Provider, ProviderType, Request, SearchHistory } from "../types";
import { mockRequests, mockSearchHistory, filterProvidersByQuery, simulateProviderResponses } from "../services/mockData";
import { toast } from "sonner";

interface AppContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchHistory: SearchHistory[];
  activeRequest: Request | null;
  searchResults: Provider[];
  isSearching: boolean;
  isRequesting: boolean;
  search: (query: string) => void;
  sendRequest: () => void;
  cancelRequest: () => void;
  selectedProvider: Provider | null;
  setSelectedProvider: (provider: Provider | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>(mockSearchHistory);
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [searchType, setSearchType] = useState<ProviderType>("product");
  const [isSearching, setIsSearching] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      // Get mock providers based on query
      const { providers, type } = filterProvidersByQuery(query);
      setSearchResults(providers);
      setSearchType(type);
      
      // Add to search history
      const newSearchEntry: SearchHistory = {
        id: `search-${Date.now()}`,
        query,
        timestamp: Date.now(),
        type
      };
      
      setSearchHistory(prev => [newSearchEntry, ...prev.slice(0, 4)]);
      setIsSearching(false);
    }, 1000);
  }, []);

  const sendRequest = useCallback(() => {
    if (!searchQuery) return;
    
    setIsRequesting(true);
    
    // Create a new request
    const newRequest: Request = {
      id: `request-${Date.now()}`,
      query: searchQuery,
      category: searchType === "product" ? "grocery" : "service",
      type: searchType,
      timestamp: Date.now(),
      status: "active",
      providers: searchResults.map(provider => ({ ...provider, confirmed: false })),
    };
    
    setActiveRequest(newRequest);
    
    // Simulate provider responses
    simulateProviderResponses(newRequest.providers, searchType)
      .then((respondedProviders) => {
        setActiveRequest(prev => {
          if (!prev) return null;
          return { ...prev, providers: respondedProviders };
        });
        
        const confirmedCount = respondedProviders.filter(p => p.confirmed).length;
        toast.success(`${confirmedCount} provider${confirmedCount !== 1 ? 's' : ''} confirmed availability!`);
        setIsRequesting(false);
      });
  }, [searchQuery, searchResults, searchType]);

  const cancelRequest = useCallback(() => {
    setActiveRequest(null);
    setIsRequesting(false);
    toast.success("Request cancelled");
  }, []);

  const value = {
    searchQuery,
    setSearchQuery,
    searchHistory,
    activeRequest,
    searchResults,
    isSearching,
    isRequesting,
    search,
    sendRequest,
    cancelRequest,
    selectedProvider,
    setSelectedProvider
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
