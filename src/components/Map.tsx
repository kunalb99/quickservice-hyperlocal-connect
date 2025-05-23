
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Provider } from '@/types';
import { MapPin, ChevronUp, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { currentUser } from '@/services/mockData';

// Simulated map component since we don't have actual Google Maps integration
const Map: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { searchResults, activeRequest, selectedProvider, setSelectedProvider } = useApp();
  const [showDetails, setShowDetails] = useState(false);
  const [signalAnimations, setSignalAnimations] = useState<{[key: string]: boolean}>({});

  // Use activeRequest providers if available, otherwise use search results
  const providers = activeRequest ? activeRequest.providers : searchResults;

  // Simulate map loading
  useEffect(() => {
    if (mapRef.current) {
      // In a real implementation, this would initialize the map
      console.log('Map would initialize here with providers:', providers);
    }
  }, [providers]);

  // Start signal animations when a request is active
  useEffect(() => {
    if (activeRequest) {
      // Initialize animations for all providers
      const initialSignals = providers.reduce((acc: {[key: string]: boolean}, provider) => {
        acc[provider.id] = true;
        return acc;
      }, {});
      
      setSignalAnimations(initialSignals);
      
      // After some time, stop animations for providers that have responded
      const timer = setTimeout(() => {
        const updatedSignals = {...initialSignals};
        providers.forEach(provider => {
          if (provider.confirmed !== undefined) {
            updatedSignals[provider.id] = false;
          }
        });
        setSignalAnimations(updatedSignals);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setSignalAnimations({});
    }
  }, [activeRequest, providers]);

  // Handle provider selection
  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowDetails(true);
  };

  return (
    <div className="flex-1 relative flex flex-col h-full">
      {/* Simulated Map */}
      <div className="flex-1 bg-gray-200 relative h-full" ref={mapRef}>
        {/* Show placeholder map with markers */}
        <div className="h-full w-full bg-gray-100 relative overflow-hidden">
          {/* Fake map background with grid */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNMCAwaDJ2NDBIMnpNMTkgMEgyMXY0MEgxOXpNMzggMGgydjQwaC0yek0wIDB2Mmg0MFYwek0wIDE5djJoNDB2LTJ6TTAgMzh2Mmg0MHYtMnoiIGZpbGw9IiNlNWU3ZWIiLz48L2c+PC9zdmc+')]"></div>
          
          {/* User location */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-lg pulse-animation"></div>
          </div>
          
          {/* Provider markers with signal animations */}
          {providers.map((provider) => {
            const isConfirmed = provider.confirmed;
            const isRejected = provider.confirmed === false;
            const isSelected = selectedProvider?.id === provider.id;
            const isAnimating = signalAnimations[provider.id];
            
            // Calculate offset positions based on provider index for visualization
            const index = providers.indexOf(provider);
            const angle = (index / providers.length) * Math.PI * 2;
            const radius = 80 + (index % 3) * 20; // Vary distance from center
            const left = `calc(50% + ${Math.cos(angle) * radius}px)`;
            const top = `calc(50% + ${Math.sin(angle) * radius}px)`;
            
            return (
              <div
                key={provider.id}
                className={`absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125 z-10' : ''}`}
                style={{ left, top }}
                onClick={() => handleProviderClick(provider)}
              >
                {/* Signal animation */}
                {isAnimating && activeRequest && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full border-2 ${isConfirmed ? 'border-green-400' : isRejected ? 'border-red-400' : 'border-quickservice-purple'} animate-ping opacity-20`}></div>
                    <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full border-2 ${isConfirmed ? 'border-green-400' : isRejected ? 'border-red-400' : 'border-quickservice-purple'} animate-ping opacity-30`}></div>
                    <div className={`absolute -top-16 -left-16 w-32 h-32 rounded-full border-2 ${isConfirmed ? 'border-green-400' : isRejected ? 'border-red-400' : 'border-quickservice-purple'} animate-ping opacity-40`}></div>
                  </div>
                )}
                
                <div className={`flex flex-col items-center`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isConfirmed 
                      ? 'bg-quickservice-green' 
                      : isRejected 
                        ? 'bg-red-500' 
                        : 'bg-quickservice-purple'
                  } text-white shadow-lg ${isAnimating ? 'pulse-animation' : ''}`}>
                    <MapPin size={16} />
                  </div>
                  {isSelected && (
                    <div className="mt-1 bg-white rounded-md shadow-md p-1 text-xs font-medium max-w-[120px] text-center">
                      {provider.name}
                    </div>
                  )}
                  {isAnimating && activeRequest && (
                    <Signal className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 text-quickservice-purple ${isConfirmed ? 'text-green-500' : isRejected ? 'text-red-500' : 'text-quickservice-purple'} animate-pulse`} size={12} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider details panel */}
      {selectedProvider && (
        <div className={`absolute left-0 right-0 bottom-0 bg-white rounded-t-xl shadow-lg transition-transform duration-300 transform ${showDetails ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'}`}>
          <div 
            className="flex items-center justify-center py-2 cursor-pointer"
            onClick={() => setShowDetails(!showDetails)}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          <div className="px-4 pb-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{selectedProvider.name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedProvider.distance.toFixed(1)} km away • ★ {selectedProvider.rating.toFixed(1)}
                </p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedProvider.confirmed === true 
                  ? 'bg-green-100 text-green-800' 
                  : selectedProvider.confirmed === false 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {selectedProvider.confirmed === true 
                  ? 'Available' 
                  : selectedProvider.confirmed === false 
                    ? 'Rejected' 
                    : 'Pending'}
              </div>
            </div>
            
            {selectedProvider.confirmed && selectedProvider.confirmationMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">{selectedProvider.confirmationMessage}</p>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-1">{selectedProvider.address}</p>
            </div>
            
            <div className="flex space-x-2">
              {selectedProvider.type === 'service' ? (
                <Button className="flex-1 bg-quickservice-purple hover:bg-quickservice-dark-purple">
                  Call Provider
                </Button>
              ) : (
                <Button className="flex-1 bg-quickservice-purple hover:bg-quickservice-dark-purple">
                  Get Directions
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
