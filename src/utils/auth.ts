// Utility function to safely get current user data
// Use this instead of directly accessing auth.users

import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  total_orders?: number;
  total_spent?: number;
  last_visit_date?: string;
}

export interface UserAuth {
  id: string;
  email?: string;
  created_at?: string;
}

// Get current authenticated user
export const getCurrentUser = async (): Promise<UserAuth | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    return user ? {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    } : null;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

// Get current user profile from profiles table
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error getting user profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error);
    return null;
  }
};

// Get user info using the safe database function
export const getUserInfo = async (): Promise<UserAuth | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_info');
    
    if (error) {
      console.error('Error calling get_user_info:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in getUserInfo:', error);
    return null;
  }
};

// Get comprehensive user context
export const getUserContext = async (): Promise<Record<string, unknown> | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_context');
    
    if (error) {
      console.error('Error calling get_user_context:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserContext:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return !!user;
};

// Create or update user profile
export const upsertUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertUserProfile:', error);
    return null;
  }
};
