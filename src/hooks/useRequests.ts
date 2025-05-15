
import { useState, useCallback } from "react";
import { Provider, ProviderType, Request, RequestStatus } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { mapDbRequestToRequest } from "@/types/supabaseTypes";
import { toast } from "sonner";

export const useRequests = (userId: string | null) => {
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const fetchActiveRequest = async () => {
    if (!userId) return null;
    
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
      
    if (requestError) {
      if (requestError.code !== 'PGRST116') { // Ignore 'no rows returned' error
        console.error('Error fetching active request:', requestError);
      }
      return null;
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
        return null;
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
        return request;
      }
    }
    
    return null;
  };

  const sendRequest = useCallback(async (
    userId: string, 
    searchQuery: string, 
    searchType: ProviderType, 
    searchResults: Provider[]
  ) => {
    if (!searchQuery || !userId) {
      return;
    }
    
    setIsRequesting(true);
    
    try {
      // Create a new request
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .insert({
          user_id: userId,
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
        return null;
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
        return newRequest;
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('An error occurred while sending request');
    }
    
    setIsRequesting(false);
    return null;
  }, []);

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
    if (!activeRequest?.id || !userId) return;
    
    try {
      // Update request status to cancelled
      const { error } = await supabase
        .from('requests')
        .update({ status: 'cancelled' })
        .eq('id', activeRequest.id)
        .eq('user_id', userId);
        
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
  }, [activeRequest, userId]);

  return {
    activeRequest,
    setActiveRequest,
    isRequesting,
    fetchActiveRequest,
    sendRequest,
    cancelRequest
  };
};
