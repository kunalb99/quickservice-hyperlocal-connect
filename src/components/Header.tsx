
import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import SearchBar from './SearchBar';

const Header: React.FC = () => {
  const { activeRequest } = useApp();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2">
            <Search size={20} className="text-quickservice-purple" />
          </Button>
          <h1 className="text-lg font-semibold text-quickservice-purple">QuickService</h1>
        </div>
      </div>
      <div className="mt-2">
        <SearchBar />
      </div>
    </header>
  );
};

export default Header;
