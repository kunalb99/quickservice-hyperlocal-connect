
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

  // Show results when there are search results or an active request
  useEffect(() => {
    setShowResults(searchResults.length > 0 || activeRequest !== null);
  }, [searchResults, activeRequest]);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex-1 pt-[110px] pb-[65px] relative flex flex-col md:flex-row">
        {showResults ? (
          <>
            {/* Small screens: Stack vertically with tab navigation */}
            <div className="md:hidden flex-1">
              {/* We're showing the map by default on mobile */}
              <Map />
            </div>

            {/* Medium+ screens: Side-by-side layout */}
            <div className="hidden md:flex md:flex-1">
              <div className="w-1/3 border-r border-gray-100">
                <SearchResults />
              </div>
              <div className="w-2/3">
                <Map />
              </div>
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
