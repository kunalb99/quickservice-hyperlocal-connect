
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Provider } from '@/types';
import { MapPin, Phone, Navigation, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ProviderCard: React.FC<{ provider: Provider }> = ({ provider }) => {
  const { setSelectedProvider } = useApp();
  
  const handleSelectProvider = () => {
    setSelectedProvider(provider);
  };
  
  return (
    <Card className="mb-3 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">{provider.name}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin size={14} className="mr-1" />
              <span className="mr-3">{provider.distance.toFixed(1)} km</span>
              <Star size={14} className="mr-1 text-yellow-500" />
              <span>{provider.rating.toFixed(1)}</span>
            </div>
          </div>
          {provider.confirmed && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Available
            </span>
          )}
        </div>
        
        {provider.confirmed && provider.confirmationMessage && (
          <div className="bg-green-50 border border-green-100 rounded p-2 mt-3 text-sm text-green-800">
            {provider.confirmationMessage}
          </div>
        )}
        
        <div className="mt-3 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-quickservice-purple border-quickservice-purple hover:bg-quickservice-purple hover:text-white"
            onClick={handleSelectProvider}
          >
            View on Map
          </Button>
          
          {provider.confirmed && (
            provider.type === "service" ? (
              <Button size="sm" className="bg-quickservice-purple hover:bg-quickservice-dark-purple">
                <Phone size={16} className="mr-1" /> Call
              </Button>
            ) : (
              <Button size="sm" className="bg-quickservice-purple hover:bg-quickservice-dark-purple">
                <Navigation size={16} className="mr-1" /> Directions
              </Button>
            )
          )}
        </div>
      </div>
    </Card>
  );
};

const SearchResults: React.FC = () => {
  const { searchResults, activeRequest, isRequesting, sendRequest, cancelRequest } = useApp();
  const [viewMode, setViewMode] = useState<'all' | 'confirmed'>('all');
  
  const providers = activeRequest?.providers || searchResults;
  
  // Filter providers based on view mode
  const filteredProviders = viewMode === 'confirmed'
    ? providers.filter(p => p.confirmed)
    : providers;
    
  const hasConfirmedProviders = providers.some(p => p.confirmed);
  const isActive = !!activeRequest;
  
  return (
    <div className="bg-white h-full overflow-y-auto">
      <div className="sticky top-0 bg-white p-4 border-b border-gray-100 z-10">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">
            {isActive ? 'Active Request' : 'Search Results'}
          </h2>
          {isActive && hasConfirmedProviders && (
            <div className="flex space-x-1 text-sm">
              <button 
                className={`px-2 py-1 rounded ${viewMode === 'all' ? 'bg-quickservice-purple text-white' : 'bg-gray-100'}`}
                onClick={() => setViewMode('all')}
              >
                All
              </button>
              <button 
                className={`px-2 py-1 rounded ${viewMode === 'confirmed' ? 'bg-quickservice-purple text-white' : 'bg-gray-100'}`}
                onClick={() => setViewMode('confirmed')}
              >
                Confirmed
              </button>
            </div>
          )}
        </div>
        
        {providers.length > 0 && !isActive && (
          <Button 
            className="w-full bg-quickservice-purple hover:bg-quickservice-dark-purple"
            onClick={sendRequest}
            disabled={isRequesting}
          >
            {isRequesting ? 'Sending Request...' : 'Send Request to Providers'}
          </Button>
        )}
        
        {isActive && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {providers.filter(p => p.confirmed).length} of {providers.length} providers confirmed
            </p>
            <Button 
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={cancelRequest}
            >
              Cancel Request
            </Button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        {filteredProviders.length > 0 ? (
          <div>
            {filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No providers {viewMode === 'confirmed' ? 'have confirmed yet' : 'found'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
