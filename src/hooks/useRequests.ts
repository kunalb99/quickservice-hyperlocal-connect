
import { useState, useCallback, useEffect, useRef } from "react";
import { Provider, ProviderType, Request } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { mapDbProviderToProvider, mapDbRequestToRequest } from "@/types/supabaseTypes";
import { toast } from "sonner";

export const useRequests = (userId: string | null) => {
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const didFetch = useRef(false);

  const fetchActiveRequest = useCallback(async () => {
    if (!userId) return null;

    const { data: requestDataRaw, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (requestError) {
      console.error('Error fetching active request:', requestError);
      return null;
    }

    if (!requestDataRaw) return null;

    const { data: requestProvidersData, error: providersError } = await supabase
      .from('request_providers')
      .select(`*, providers:provider_id (*)`)
      .eq('request_id', requestDataRaw.id);

    if (providersError) {
      console.error('Error fetching request providers:', providersError);
      return null;
    }

    const providers: Provider[] = requestProvidersData.map(item => {
      const provider = mapDbProviderToProvider(item.providers);
      return {
        ...provider,
        confirmed: item.confirmed || false,
        confirmationMessage: item.confirmation_message || undefined,
      };
    });

    const request = mapDbRequestToRequest(requestDataRaw, providers);
    setActiveRequest(request);
    return request;
  }, [userId]);

  useEffect(() => {
    if (userId && !didFetch.current) {
      fetchActiveRequest();
      didFetch.current = true;
    }
  }, [userId, fetchActiveRequest]);

  const simulateProviderResponses = useCallback(async (requestId: string) => {
    if (!activeRequest) return;

    // First, wait a bit to show signals being sent
    setTimeout(async () => {
      const responseProviders = activeRequest.providers.map(provider => {
        // Randomly decide if provider accepts, rejects, or doesn't respond
        const randomResponse = Math.random();
        const isConfirmed = randomResponse > 0.3;
        const willRespond = randomResponse > 0.1; // 90% will respond
        
        return {
          request_id: requestId,
          provider_id: provider.id,
          confirmed: willRespond ? isConfirmed : null,
          confirmation_message: willRespond && isConfirmed 
            ? getRandomConfirmationMessage(provider.type)
            : undefined
        };
      });

      // Update each provider's response individually with slight timing differences
      let confirmedCount = 0;
      let rejectedCount = 0;
      
      for (const [index, provider] of responseProviders.entries()) {
        // Skip if the provider won't respond
        if (provider.confirmed === null) continue;
        
        // Add a slight delay between updates for visual effect
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        // Update the provider's response in the database
        // Using RLS service role client for operations where RLS might block user
        // or ensuring user_id is properly set to fulfill RLS policies
        await supabase
          .from('request_providers')
          .update({
            confirmed: provider.confirmed,
            confirmation_message: provider.confirmation_message
          })
          .eq('request_id', provider.request_id)
          .eq('provider_id', provider.provider_id);
        
        // Count responses for notifications
        if (provider.confirmed) {
          confirmedCount++;
        } else {
          rejectedCount++;
        }
        
        // Refresh the active request to show updated responses
        await fetchActiveRequest();
      }

      // Show toast notifications about responses
      if (confirmedCount > 0) {
        toast.success(`${confirmedCount} provider${confirmedCount !== 1 ? 's' : ''} confirmed availability!`);
      }
      
      if (rejectedCount > 0) {
        toast.error(`${rejectedCount} provider${rejectedCount !== 1 ? 's' : ''} can't fulfill your request.`);
      }
      
    }, 2000);
  }, [activeRequest, fetchActiveRequest]);

  const sendRequest = useCallback(async (
    userId: string,
    searchQuery: string,
    searchType: ProviderType,
    searchResults: Provider[]
  ) => {
    if (!searchQuery || !userId) return null;

    setIsRequesting(true);

    try {
      // First create the request
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

      if (requestError || !requestData) {
        toast.error('Failed to create request');
        console.error('Error creating request:', requestError);
        return null;
      }

      // Create provider requests one by one to avoid batch RLS issues
      for (const provider of searchResults) {
        const { error: providerError } = await supabase
          .from('request_providers')
          .insert({
            request_id: requestData.id,
            provider_id: provider.id,
            confirmed: false
          });

        if (providerError) {
          console.error(`Error adding provider ${provider.id} to request:`, providerError);
        }
      }

      toast.success("Request sent to nearby providers");
      
      const newRequest: Request = {
        id: requestData.id,
        query: searchQuery,
        category: requestData.category,
        type: searchType,
        timestamp: new Date(requestData.timestamp).getTime(),
        status: 'active',
        providers: searchResults.map(provider => ({ ...provider, confirmed: false }))
      };

      setActiveRequest(newRequest);
      
      // Start the simulation with a delay to show signals being sent first
      setTimeout(() => simulateProviderResponses(requestData.id), 1000);
      
      return newRequest;
    } catch (error) {
      toast.error('An error occurred while sending request');
      console.error('Error sending request:', error);
      return null;
    } finally {
      setIsRequesting(false);
    }
  }, [simulateProviderResponses]);

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
      const { error } = await supabase
        .from('requests')
        .update({ status: 'cancelled' })
        .eq('id', activeRequest.id)
        .eq('user_id', userId);

      if (error) {
        toast.error('Failed to cancel request');
        console.error('Error cancelling request:', error);
        return;
      }

      setActiveRequest(null);
      toast.success('Request cancelled');
    } catch (error) {
      toast.error('An error occurred while cancelling request');
      console.error('Error in cancel request:', error);
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
