
import { useState, useEffect } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      
      // Check if user is logged in
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session?.user) {
        const { id, email } = sessionData.session.user;
        
        // Fetch additional user data from profiles
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        
        if (userError) {
          console.error('Error fetching user data:', userError);
        }
        
        // Handle location data safely
        let userLocation: { lat: number; lng: number } | undefined = undefined;
        if (userData?.location) {
          // If using PostGIS geography type (ST_AsGeoJSON)
          try {
            // Try parsing as GeoJSON
            const geoJson = typeof userData.location === 'string' 
              ? JSON.parse(userData.location) 
              : userData.location;

            if (geoJson && geoJson.coordinates) {
              userLocation = {
                lng: geoJson.coordinates[0],
                lat: geoJson.coordinates[1]
              };
            }
          } catch (e) {
            console.error('Error parsing location:', e);
          }
        }
        
        setUser({
          id,
          email: email || '',
          name: userData?.name || email?.split('@')[0] || '',
          phone: userData?.phone || '',
          location: userLocation
        });
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    };
    
    checkUser();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { id, email } = session.user;
          
          // Fetch additional user data
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
          
          // Handle location data safely
          let userLocation: { lat: number; lng: number } | undefined = undefined;
          if (userData?.location) {
            // If using PostGIS geography type (ST_AsGeoJSON)
            try {
              // Try parsing as GeoJSON
              const geoJson = typeof userData.location === 'string' 
                ? JSON.parse(userData.location) 
                : userData.location;

              if (geoJson && geoJson.coordinates) {
                userLocation = {
                  lng: geoJson.coordinates[0],
                  lat: geoJson.coordinates[1]
                };
              }
            } catch (e) {
              console.error('Error parsing location:', e);
            }
          }
          
          setUser({
            id,
            email: email || '',
            name: userData?.name || email?.split('@')[0] || '',
            phone: userData?.phone || '',
            location: userLocation
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Logged in successfully');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };
  
  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Account created successfully! Please log in.');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Logged out successfully');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    login,
    signup,
    logout
  };
};
