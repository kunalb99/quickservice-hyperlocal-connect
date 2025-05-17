
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Provider, SearchHistory } from "@/types";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSearch } from "@/hooks/useSearch";
import { useRequests } from "@/hooks/useRequests";
import { AppContextType } from "./types";
import { mapDbSearchHistoryToSearchHistory } from "@/types/supabaseTypes";
import { toast } from "sonner";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Custom hooks
  const { user, isLoading, login, signup, logout } = useAuth();
  const { searchQuery, setSearchQuery, searchResults, isSearching, searchType, search, fetchSearchHistory } = useSearch(user?.id);
  const { activeRequest, isRequesting, fetchActiveRequest, sendRequest, cancelRequest } = useRequests(user?.id);

  // Check for protected routes and redirect if needed
  useEffect(() => {
    const protectedRoutes = ['/profile', '/requests'];
    if (!user && !isLoading && protectedRoutes.includes(location.pathname)) {
      navigate('/login');
    }
  }, [user, isLoading, location.pathname, navigate]);

  // Load search history when user changes
  useEffect(() => {
    if (user?.id) {
      const loadSearchHistory = async () => {
        const historyData = await fetchSearchHistory();
        const searchHistoryData = historyData.map(mapDbSearchHistoryToSearchHistory);
        setSearchHistory(searchHistoryData);
      };
      
      loadSearchHistory();
      fetchActiveRequest();
    } else {
      setSearchHistory([]);
    }
  }, [user?.id, fetchSearchHistory, fetchActiveRequest]);

  // Wrapper for sendRequest to use current state values
  const handleSendRequest = async () => {
    if (!user?.id) {
      toast.error('Please log in to send requests');
      navigate('/login');
      return;
    }
    
    await sendRequest(user.id, searchQuery, searchType, searchResults);
  };

  const value: AppContextType = {
    searchQuery,
    setSearchQuery,
    searchHistory,
    activeRequest,
    searchResults,
    isSearching,
    isRequesting,
    search,
    sendRequest: handleSendRequest,
    cancelRequest,
    selectedProvider,
    setSelectedProvider,
    user,
    isLoading,
    login,
    signup,
    logout
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
