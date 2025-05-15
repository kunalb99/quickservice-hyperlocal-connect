
import React from 'react';
import { Search } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-quickservice-light-gray rounded-full flex items-center justify-center mb-4">
        <Search size={24} className="text-quickservice-purple" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Find what you need</h2>
      <p className="text-gray-500 max-w-xs">
        Search for products or services to see nearby providers in real-time
      </p>
    </div>
  );
};

export default EmptyState;
