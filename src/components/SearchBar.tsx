
import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, search, searchHistory, isSearching } = useApp();
  const [isFocused, setIsFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update local query when searchQuery changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (query: string) => {
    search(query);
    setIsFocused(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery) handleSearch(localQuery);
  };

  const clearSearch = () => {
    setLocalQuery('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const formattedDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for milk, plumber, etc."
            className="pl-10 pr-10 py-6 rounded-full border-gray-200 focus:border-quickservice-purple focus:ring-quickservice-purple"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
          />
          {localQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={clearSearch}
            >
              <X size={18} />
            </Button>
          )}
        </div>
        <Button type="submit" className="sr-only">
          Search
        </Button>
      </form>

      {/* Search history dropdown */}
      {isFocused && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-lg z-20 max-h-72 overflow-y-auto">
          <div className="p-2">
            <h3 className="text-sm text-gray-500 font-medium px-3 py-2">Recent Searches</h3>
            <ul>
              {searchHistory.map((item) => (
                <li key={item.id}>
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center justify-between"
                    onClick={() => handleSearch(item.query)}
                  >
                    <div className="flex items-center">
                      <Search size={16} className="mr-2 text-gray-400" />
                      <span>{item.query}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formattedDate(item.timestamp)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
