
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Sample products data
const sampleProducts = [
  {
    name: 'Amul Full Cream Milk',
    category: 'dairy',
    description: 'Fresh full cream milk, 500ml packet'
  },
  {
    name: 'Paneer',
    category: 'dairy',
    description: 'Fresh cottage cheese, 200g block'
  },
  {
    name: 'Bread',
    category: 'bakery',
    description: 'Brown bread, 400g loaf'
  },
  {
    name: 'T-shirt',
    category: 'clothing',
    description: 'Cotton round neck t-shirt'
  },
  {
    name: 'Rice',
    category: 'grocery',
    description: 'Basmati rice, 1kg pack'
  },
  {
    name: 'Tea',
    category: 'beverage',
    description: 'Black tea leaves, 250g pack'
  }
];

const DataInitializer = () => {
  const checkAndCreateTables = async () => {
    try {
      // Check if products table exists by trying to fetch products
      const { data: productsData, error: productsCheckError } = await supabase
        .from('products')
        .select('count')
        .limit(1);

      if (productsCheckError && productsCheckError.code === '42P01') { // relation does not exist
        console.log('Products table does not exist, you need to create it in Supabase');
        toast.error('Products table is missing. Please create it in Supabase');
      } else {
        // Check if we have any products
        const { count: productsCount, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.error('Error checking products count:', countError);
          return;
        }

        // If no products, create sample products
        if (productsCount === 0) {
          const { error: insertError } = await supabase
            .from('products')
            .insert(sampleProducts);

          if (insertError) {
            console.error('Error inserting sample products:', insertError);
            toast.error('Failed to create sample products');
          } else {
            console.log('Sample products created successfully');
            toast.success('Sample products created successfully');
          }
        }

        // Check if provider_products table exists and has any data
        const { data: providerProducts, error: ppCheckError } = await supabase
          .from('provider_products')
          .select('count')
          .limit(1);

        if (ppCheckError && ppCheckError.code === '42P01') {
          console.log('Provider_products table does not exist, you need to create it in Supabase');
          toast.error('Provider-Products relationship table is missing. Please create it in Supabase');
        }
      }
    } catch (error) {
      console.error('Error during data initialization:', error);
    }
  };

  useEffect(() => {
    checkAndCreateTables();
  }, []);

  return null;
};

export default DataInitializer;
