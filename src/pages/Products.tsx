
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const Products = () => {
  const navigate = useNavigate();
  const { setSearchQuery, search } = useApp();
  
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return data as Product[];
    }
  });

  const handleSearch = (productName: string) => {
    setSearchQuery(productName);
    search(productName);
    navigate('/');
  };

  useEffect(() => {
    if (error) {
      toast.error('Failed to load products');
      console.error('Error loading products:', error);
    }
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 pt-[110px] pb-[65px] px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Loading products...</div>
          ) : !products || products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No products found. Products will appear here once added.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSearch(product.name)}
                        title="Search for providers"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
