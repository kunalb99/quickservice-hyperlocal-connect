
import { useState, useCallback } from "react";
import { Provider, ProviderType } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { mapDbProviderToProvider } from "@/types/supabaseTypes";
import { toast } from "sonner";

export const useSearch = (userId: string | null) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<ProviderType>("product");

  const fetchSearchHistory = async () => {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('Error fetching search history:', error);
      return [];
    }
    
    return data || [];
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
      if (userId && query) {
        const { error: historyError } = await supabase
          .from('search_history')
          .insert({
            user_id: userId,
            query,
            type
          });
          
        if (historyError) {
          console.error('Error saving search history:', historyError);
        }
      }
    } catch (error) {
      console.error('Error during search:', error);
      toast.error('An error occurred during search');
    }
    
    setIsSearching(false);
    return type;
  }, [userId]);

  return { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    isSearching, 
    searchType, 
    search, 
    fetchSearchHistory 
  };
};
