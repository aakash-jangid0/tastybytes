import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { WebsiteSettings, defaultWebsiteSettings } from '../types/websiteSettings';
import { toast } from 'react-hot-toast';

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

interface WebsiteSettingsContextType {
  settings: WebsiteSettings;
  updateSettings: (newSettings: Partial<WebsiteSettings>) => void;
  saveSettings: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  refreshSettings: () => Promise<void>;
}

const WebsiteSettingsContext = createContext<WebsiteSettingsContextType | undefined>(undefined);

export const useWebsiteSettings = (): WebsiteSettingsContextType => {
  const context = useContext(WebsiteSettingsContext);
  if (!context) {
    throw new Error('useWebsiteSettings must be used within a WebsiteSettingsProvider. Please wrap your component with <WebsiteSettingsProvider>');
  }
  return context;
};

interface WebsiteSettingsProviderProps {
  children: ReactNode;
}

export const WebsiteSettingsProvider: React.FC<WebsiteSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings>(defaultWebsiteSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Track if user is actively editing
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isEditingRef = useRef(false); // Ref to track editing state for subscriptions

  // Fetch settings from database
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        // Check if it's a table not found error
        if (error.code === '42P01' || error.message?.includes('relation "website_settings" does not exist')) {
          console.warn('Website settings table does not exist, using default settings');
          setSettings(defaultWebsiteSettings);
          return;
        }
        throw error;
      }

      if (data) {
        setSettings({ ...defaultWebsiteSettings, ...data });
      } else {
        setSettings(defaultWebsiteSettings);
      }
    } catch (error: unknown) {
      console.error('Error fetching website settings:', error);
      const err = error as SupabaseError;
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        details: err.details,
        hint: err.hint
      });
      // Only show user-facing error for actual connection issues, not missing table
      if (!err.message?.includes('relation "website_settings" does not exist')) {
        toast.error('Failed to load website settings');
      }
      setSettings(defaultWebsiteSettings);
    } finally {
      setIsLoading(false);
    }
  };

  // Update settings locally with debouncing
  const updateSettings = (newSettings: Partial<WebsiteSettings>) => {
    setIsEditing(true);
    isEditingRef.current = true; // Update ref for subscription
    
    // Immediately update the UI for responsive feedback
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Clear any existing timeout
    if (editingTimeoutRef.current) {
      clearTimeout(editingTimeoutRef.current);
    }
    
    // Set a new timeout to clear editing state
    editingTimeoutRef.current = setTimeout(() => {
      setIsEditing(false);
      isEditingRef.current = false; // Update ref
      editingTimeoutRef.current = null;
    }, 1500); // Reduced to 1.5 seconds for better responsiveness
  };

  // Save settings to database
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Check if table exists first
      const { data: existingData, error: checkError } = await supabase
        .from('website_settings')
        .select('id')
        .limit(1)
        .single();

      // Handle table not existing
      if (checkError && (checkError.code === '42P01' || checkError.message?.includes('relation "website_settings" does not exist'))) {
        console.warn('Website settings table does not exist, cannot save settings');
        toast.error('Website settings table not found. Please contact administrator.');
        return;
      }

      // Prepare data object with only fields that exist in database
      const dbSettings = {
        logo_url: settings.logo_url,
        site_name: settings.site_name || 'TastyBites',
        tagline: settings.tagline,
        header_bg_color: settings.primary_color || '#f97316',
        footer_text: '© 2025 TastyBites. All rights reserved.',
        footer_bg_color: '#f3f4f6',
        footer_text_color: '#6b7280',
        show_social_links: true,
        facebook_url: settings.facebook_url,
        twitter_url: settings.twitter_url,
        instagram_url: settings.instagram_url,
        linkedin_url: settings.linkedin_url,
        youtube_url: settings.youtube_url,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        contact_address: settings.contact_address,
        opening_hours: settings.hours_mon_fri,
        hero_image_url: settings.hero_background_image,
        hero_title: settings.hero_title,
        hero_description: settings.hero_subtitle,
        hero_button_text: settings.hero_cta_text,
        hero_button_url: settings.hero_cta_link,
        features_title: settings.features_section_title,
        feature_1_title: settings.feature_1_title,
        feature_1_description: settings.feature_1_description,
        feature_2_title: settings.feature_2_title,
        feature_2_description: settings.feature_2_description,
        feature_3_title: settings.feature_3_title,
        feature_3_description: settings.feature_3_description,
        popular_dishes_title: settings.popular_dishes_title,
        cta_title: settings.cta_title,
        cta_description: settings.cta_subtitle,
        cta_button_text: settings.cta_button_text,
        primary_color: settings.primary_color
      };

      // Remove undefined/null values
      const cleanedSettings = Object.fromEntries(
        Object.entries(dbSettings).filter(([, value]) => value !== undefined && value !== null)
      );

      let result;
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('website_settings')
          .update({
            ...cleanedSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
      } else {
        // Insert new record
        result = await supabase
          .from('website_settings')
          .insert([{
            ...cleanedSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
      }

      if (result.error) throw result.error;

      toast.success('Website settings saved successfully!');
      
      // Trigger a broadcast to other components
      window.dispatchEvent(new CustomEvent('websiteSettingsUpdated', { 
        detail: settings 
      }));
    } catch (error: unknown) {
      console.error('Error saving website settings:', error);
      const err = error as SupabaseError;
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        details: err.details,
        hint: err.hint
      });
      toast.error('Failed to save website settings');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Refresh settings from database
  const refreshSettings = async () => {
    await fetchSettings();
  };

  // Initialize settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    const subscription = supabase
      .channel('website_settings_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'website_settings' 
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Use a small delay to check editing state and avoid conflicts
            setTimeout(() => {
              // Only update if user is not currently editing (using ref to avoid stale closure)
              if (!isEditingRef.current) {
                const updatedSettings = payload.new as WebsiteSettings;
                setSettings(() => ({ ...defaultWebsiteSettings, ...updatedSettings }));
              }
            }, 150);
            
            // Always broadcast the event for other components
            window.dispatchEvent(new CustomEvent('websiteSettingsUpdated', { 
              detail: payload.new 
            }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Remove isEditing dependency to prevent subscription recreation

  // Cleanup editing timeout on unmount
  useEffect(() => {
    return () => {
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
      }
      isEditingRef.current = false; // Reset editing state
    };
  }, []);

  const value: WebsiteSettingsContextType = {
    settings,
    updateSettings,
    saveSettings,
    isLoading,
    isSaving,
    isEditing,
    refreshSettings
  };

  return (
    <WebsiteSettingsContext.Provider value={value}>
      {children}
    </WebsiteSettingsContext.Provider>
  );
};

export default WebsiteSettingsProvider;
