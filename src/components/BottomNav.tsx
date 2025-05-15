
import React from 'react';
import { Search, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BottomNav: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-10">
      <Button variant="ghost" className="flex-1 flex flex-col items-center py-2 text-quickservice-purple">
        <Search size={20} />
        <span className="text-xs mt-1">Search</span>
      </Button>
      <Button variant="ghost" className="flex-1 flex flex-col items-center py-2 text-gray-500">
        <Clock size={20} />
        <span className="text-xs mt-1">Requests</span>
      </Button>
      <Button variant="ghost" className="flex-1 flex flex-col items-center py-2 text-gray-500">
        <User size={20} />
        <span className="text-xs mt-1">Profile</span>
      </Button>
    </div>
  );
};

export default BottomNav;
