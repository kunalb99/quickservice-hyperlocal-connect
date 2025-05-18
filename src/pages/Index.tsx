
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import Map from '@/components/Map';
import SearchResults from '@/components/SearchResults';
import BottomNav from '@/components/BottomNav';
import EmptyState from '@/components/EmptyState';

const Index = () => {
  const { searchQuery, searchResults, activeRequest } = useApp();
  const [showResults, setShowResults] = useState(false);
  const [showMap, setShowMap] = useState(true); // Default to showing the map on mobile

  // Show results when there are search results or an active request
  useEffect(() => {
    setShowResults(searchResults.length > 0 || activeRequest !== null);
    
    // Automatically show the map when searching or when there's an active request
    if (searchResults.length > 0 || activeRequest !== null) {
      setShowMap(true);
    }
  }, [searchResults, activeRequest]);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex-1 pt-[110px] pb-[65px] relative flex flex-col md:flex-row">
        {showResults ? (
          <>
            {/* Small screens: Stack vertically with tab navigation */}
            <div className="md:hidden flex-1 flex flex-col h-full">
              {/* Toggle between map and list on mobile */}
              <div className="absolute top-0 right-0 left-0 z-10 flex bg-white border-b border-gray-100">
                <button 
                  className={`flex-1 py-2 text-sm font-medium ${showMap ? 'text-quickservice-purple' : 'text-gray-500'}`}
                  onClick={() => setShowMap(true)}
                >
                  Map View
                </button>
                <button 
                  className={`flex-1 py-2 text-sm font-medium ${!showMap ? 'text-quickservice-purple' : 'text-gray-500'}`}
                  onClick={() => setShowMap(false)}
                >
                  List View
                </button>
              </div>
              
              {/* Show either map or results based on tab selection */}
              <div className="mt-10 flex-1">
                {showMap ? <Map /> : <SearchResults />}
              </div>
            </div>

            {/* Medium+ screens: Side-by-side layout */}
            <div className="hidden md:flex md:flex-1 h-full">
              <div className="w-1/3 border-r border-gray-100 h-full overflow-hidden">
                <SearchResults />
              </div>
              <div className="w-2/3 h-full overflow-hidden">
                <Map />
              </div>
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
