
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { Provider, ProviderType, Request, RequestStatus, SearchHistory, User } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mapDbProviderToProvider, mapDbSearchHistoryToSearchHistory, mapDbRequestToRequest } from "@/types/supabaseTypes";
import { useLocation, useNavigate } from "react-router-dom";

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
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [searchType, setSearchType] = useState<ProviderType>("product");
  const [isSearching, setIsSearching] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Check for user session on initial load
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      
      // Check if user is logged in
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session?.user) {
        const { id, email } = sessionData.session.user;
        
        // Fetch additional user data from profiles
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        
        if (userError) {
          console.error('Error fetching user data:', userError);
        }
        
        // Handle location data safely
        let userLocation: { lat: number; lng: number } | undefined = undefined;
        if (userData?.location) {
          // If using PostGIS geography type (ST_AsGeoJSON)
          try {
            // Try parsing as GeoJSON
            const geoJson = typeof userData.location === 'string' 
              ? JSON.parse(userData.location) 
              : userData.location;

            if (geoJson && geoJson.coordinates) {
              userLocation = {
                lng: geoJson.coordinates[0],
                lat: geoJson.coordinates[1]
              };
            }
          } catch (e) {
            console.error('Error parsing location:', e);
          }
        }
        
        setUser({
          id,
          email: email || '',
          name: userData?.name || email?.split('@')[0] || '',
          phone: userData?.phone || '',
          location: userLocation
        });
        
        // Fetch user's search history
        fetchSearchHistory();
        
        // Check for active requests
        fetchActiveRequest();
      } else {
        setUser(null);
        setSearchHistory([]);
        setActiveRequest(null);
        
        // Redirect to login if on a protected route
        const protectedRoutes = ['/profile', '/requests'];
        if (protectedRoutes.includes(location.pathname)) {
          navigate('/login');
        }
      }
      
      setIsLoading(false);
    };
    
    checkUser();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { id, email } = session.user;
          
          // Fetch additional user data
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
          
          // Handle location data safely
          let userLocation: { lat: number; lng: number } | undefined = undefined;
          if (userData?.location) {
            // If using PostGIS geography type (ST_AsGeoJSON)
            try {
              // Try parsing as GeoJSON
              const geoJson = typeof userData.location === 'string' 
                ? JSON.parse(userData.location) 
                : userData.location;

              if (geoJson && geoJson.coordinates) {
                userLocation = {
                  lng: geoJson.coordinates[0],
                  lat: geoJson.coordinates[1]
                };
              }
            } catch (e) {
              console.error('Error parsing location:', e);
            }
          }
          
          setUser({
            id,
            email: email || '',
            name: userData?.name || email?.split('@')[0] || '',
            phone: userData?.phone || '',
            location: userLocation
          });
          
          fetchSearchHistory();
          fetchActiveRequest();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSearchHistory([]);
          setActiveRequest(null);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [location.pathname, navigate]);

  // Fetch search history for logged-in user
  const fetchSearchHistory = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('Error fetching search history:', error);
      return;
    }
    
    if (data) {
      const searchHistoryData = data.map(mapDbSearchHistoryToSearchHistory);
      setSearchHistory(searchHistoryData);
    }
  };
  
  // Fetch active request for logged-in user
  const fetchActiveRequest = async () => {
    if (!user?.id) return;
    
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
      
    if (requestError) {
      if (requestError.code !== 'PGRST116') { // Ignore 'no rows returned' error
        console.error('Error fetching active request:', requestError);
      }
      return;
    }
    
    if (requestData) {
      // Fetch providers associated with the request
      const { data: requestProvidersData, error: providersError } = await supabase
        .from('request_providers')
        .select(`
          *,
          providers:provider_id (*)
        `)
        .eq('request_id', requestData.id);
        
      if (providersError) {
        console.error('Error fetching request providers:', providersError);
        return;
      }
      
      if (requestProvidersData) {
        const providers: Provider[] = requestProvidersData.map(item => {
          const provider = mapDbProviderToProvider(item.providers);
          return {
            ...provider,
            confirmed: item.confirmed || false,
            confirmationMessage: item.confirmation_message || undefined,
          };
        });
        
        const request = mapDbRequestToRequest(requestData, providers);
        setActiveRequest(request);
      }
    }
  };

  const search = useCallback(async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    // Determine search type based on query
    const serviceKeywords = ['plumber', 'electrician', 'cleaner', 'repair', 'service', 'fix'];
    const type: ProviderType = serviceKeywords.some(keyword => query.toLowerCase().includes(keyword)) 
      ? 'service' 
      : 'product';
    setSearchType(type);
    
    try {
      // Search for providers based on query
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .textSearch('name', query, { 
          config: 'english',
          type: 'websearch'
        })
        .order('rating', { ascending: false });
        
      if (error) {
        console.error('Error searching providers:', error);
        toast.error('Failed to search providers');
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      let providers: Provider[] = [];
      
      if (data && data.length > 0) {
        providers = data.map(provider => mapDbProviderToProvider(provider));
      } else {
        // If no direct matches, try to find providers by category
        const { data: categoryData, error: categoryError } = await supabase
          .from('providers')
          .select('*')
          .eq('category', query.toLowerCase())
          .order('rating', { ascending: false });
          
        if (categoryError) {
          console.error('Error searching providers by category:', categoryError);
        } else if (categoryData) {
          providers = categoryData.map(provider => mapDbProviderToProvider(provider));
        }
      }
      
      // Sort by rating if we have results
      providers.sort((a, b) => b.rating - a.rating);
      
      setSearchResults(providers);
      
      // Save search to history if user is logged in
      if (user?.id && query) {
        const { error: historyError } = await supabase
          .from('search_history')
          .insert({
            user_id: user.id,
            query,
            type
          });
          
        if (historyError) {
          console.error('Error saving search history:', historyError);
        } else {
          // Refresh search history
          fetchSearchHistory();
        }
      }
    } catch (error) {
      console.error('Error during search:', error);
      toast.error('An error occurred during search');
    }
    
    setIsSearching(false);
  }, [user]);

  const sendRequest = useCallback(async () => {
    if (!searchQuery || !user?.id) {
      if (!user?.id) {
        toast.error('Please log in to send requests');
        navigate('/login');
      }
      return;
    }
    
    setIsRequesting(true);
    
    try {
      // Create a new request
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .insert({
          user_id: user.id,
          query: searchQuery,
          category: searchType === 'product' ? 'grocery' : 'service',
          type: searchType,
          status: 'active'
        })
        .select()
        .single();
        
      if (requestError) {
        console.error('Error creating request:', requestError);
        toast.error('Failed to create request');
        setIsRequesting(false);
        return;
      }
      
      if (requestData) {
        // Associate providers with the request
        const requestProviders = searchResults.map(provider => ({
          request_id: requestData.id,
          provider_id: provider.id,
          confirmed: false
        }));
        
        const { error: providerError } = await supabase
          .from('request_providers')
          .insert(requestProviders);
          
        if (providerError) {
          console.error('Error associating providers with request:', providerError);
          toast.error('Failed to associate providers with request');
          // Still continue as the request was created
        }
        
        // Simulate provider responses (in real app this would be handled by a backend process)
        setTimeout(() => {
          simulateProviderResponses(requestData.id);
        }, 2000);
        
        // Create new request object
        const newRequest: Request = {
          id: requestData.id,
          query: searchQuery,
          category: requestData.category,
          type: searchType,
          timestamp: new Date(requestData.timestamp).getTime(),
          status: 'active',
          providers: searchResults.map(provider => ({ ...provider, confirmed: false })),
        };
        
        setActiveRequest(newRequest);
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('An error occurred while sending request');
    }
    
    setIsRequesting(false);
  }, [searchQuery, searchResults, searchType, user, navigate]);

  // Simulate provider responses (in a real app, this would happen through a backend process)
  const simulateProviderResponses = async (requestId: string) => {
    // In a real app, this would be handled by a backend service
    // For demo purposes, we'll just update some providers as confirmed after a delay
    setTimeout(async () => {
      if (!activeRequest) return;
      
      // Randomly select some providers to confirm
      const confirmedProviders = activeRequest.providers
        .filter(() => Math.random() > 0.3) // ~70% chance of confirming
        .map(provider => ({
          request_id: requestId,
          provider_id: provider.id,
          confirmed: true,
          confirmation_message: getRandomConfirmationMessage(provider.type)
        }));
      
      if (confirmedProviders.length > 0) {
        // Update the request_providers table
        for (const provider of confirmedProviders) {
          await supabase
            .from('request_providers')
            .update({
              confirmed: true,
              confirmation_message: provider.confirmation_message
            })
            .eq('request_id', provider.request_id)
            .eq('provider_id', provider.provider_id);
        }
        
        // Refresh the active request
        fetchActiveRequest();
        
        toast.success(`${confirmedProviders.length} provider${confirmedProviders.length !== 1 ? 's' : ''} confirmed availability!`);
      }
    }, 3000);
  };
  
  // Generate random confirmation messages
  const getRandomConfirmationMessage = (type: ProviderType): string => {
    const productMessages = [
      "We have this item in stock and ready for pickup!",
      "This product is available. Would you like us to hold it for you?",
      "Item available for same-day pickup or delivery.",
      "We have 5 units available. Come visit us!"
    ];
    
    const serviceMessages = [
      "We're available today! When would you like us to come by?",
      "We can help with this! Call us to schedule a time.",
      "Our team is ready to assist you. Please call to confirm.",
      "We have an opening this afternoon if you need immediate service."
    ];
    
    const messages = type === 'product' ? productMessages : serviceMessages;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const cancelRequest = useCallback(async () => {
    if (!activeRequest?.id || !user?.id) return;
    
    try {
      // Update request status to cancelled
      const { error } = await supabase
        .from('requests')
        .update({ status: 'cancelled' })
        .eq('id', activeRequest.id)
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error cancelling request:', error);
        toast.error('Failed to cancel request');
        return;
      }
      
      setActiveRequest(null);
      toast.success('Request cancelled');
    } catch (error) {
      console.error('Error in cancel request:', error);
      toast.error('An error occurred while cancelling request');
    }
  }, [activeRequest, user]);

  // Authentication functions
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Logged in successfully');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };
  
  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Account created successfully! Please log in.');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Logged out successfully');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

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
