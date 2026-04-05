import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Save, 
  Upload,
  Clock,
  Star,
  X,
  Plus,
  Eye,
  Palette,
  Image,
  Layout,
  UtensilsCrossed,
  ChefHat,
  Heart,
  Award,
  Phone,
  Check,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin
} from 'lucide-react';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';
import { WebsiteSettingsProvider } from '../../context/WebsiteSettingsContext';
import ImageUpload from '../../components/ui/ImageUpload';
import { useMenuItems } from '../../hooks/useMenuItems';
import { MenuItem } from '../../types/menu';
import { useGuestGuard } from '../../hooks/useGuestGuard';

function WebsiteSettingsComprehensive() {
  const { isGuest, guardAction } = useGuestGuard();
  const [showMenuSelector, setShowMenuSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Use the website settings context - Fixed isSaving import
  const { 
    settings, 
    updateSettings, 
    saveSettings, 
    isSaving,
    refreshSettings 
  } = useWebsiteSettings();

  // Get menu items for popular dishes selection
  const { menuItems } = useMenuItems();
  
  // Get selected popular dishes
  const selectedDishes = menuItems.filter(item => 
    settings.popular_dish_ids?.includes(item.id)
  );

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const handleSave = async () => {
    try {
      await saveSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    }
  };

  const handleLogoUpload = (url: string) => {
    updateSettings({ logo_url: url });
    toast.success('Logo uploaded successfully!');
  };
  const handleDishSelection = (dish: MenuItem) => {
    const currentIds = settings.popular_dish_ids || [];
    
    if (currentIds.includes(dish.id)) {
      // Remove dish
      const newIds = currentIds.filter(id => id !== dish.id);
      updateSettings({ popular_dish_ids: newIds });
      toast.success(`${dish.name} removed from popular dishes`);
    } else if (currentIds.length < 3) {
      // Add dish (max 3)
      const newIds = [...currentIds, dish.id];
      updateSettings({ popular_dish_ids: newIds });
      toast.success(`${dish.name} added to popular dishes`);
    } else {
      toast.error('You can only select up to 3 popular dishes');
    }
  };

  const handleOpenMenuSelector = () => {
    setShowMenuSelector(true);
  };

  const handleCloseMenuSelector = () => {
    setShowMenuSelector(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Layout className="w-5 h-5" /> },
    { id: 'hero', label: 'Hero Section', icon: <Image className="w-5 h-5" /> },
    { id: 'features', label: 'Features', icon: <Star className="w-5 h-5" /> },
    { id: 'dishes', label: 'Popular Dishes', icon: <UtensilsCrossed className="w-5 h-5" /> },
    { id: 'contact', label: 'Contact & Social', icon: <Phone className="w-5 h-5" /> },
    { id: 'style', label: 'Styling', icon: <Palette className="w-5 h-5" /> }  ];
  
  const MenuSelector = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleCloseMenuSelector}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold">Select Popular Dishes (Max 3)</h3>
          <button
            onClick={handleCloseMenuSelector}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]" data-lenis-prevent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((dish) => {
              const isSelected = settings.popular_dish_ids?.includes(dish.id);
              
              return (
                <motion.div
                  key={dish.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDishSelection(dish)}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  
                  <h4 className="font-semibold text-gray-900 mb-1">{dish.name}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{dish.description}</p>
                  <p className="text-lg font-bold text-orange-500">₹{dish.price}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Selected: {settings.popular_dish_ids?.length || 0}/3 dishes
            </p>
            <button
              onClick={handleCloseMenuSelector}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
  const WebsitePreview = () => {
    const iconMap = {
      UtensilsCrossed: <UtensilsCrossed className="w-6 h-6" />,
      Clock: <Clock className="w-6 h-6" />,
      Star: <Star className="w-6 h-6" />,
      ChefHat: <ChefHat className="w-6 h-6" />,
      Heart: <Heart className="w-6 h-6" />,
      Award: <Award className="w-6 h-6" />
    };

    const features = [
      {
        icon: iconMap[settings.feature_1_icon as keyof typeof iconMap] || iconMap.UtensilsCrossed,
        title: settings.feature_1_title || 'Fresh Ingredients',
        description: settings.feature_1_description || 'We use only the finest ingredients'
      },
      {
        icon: iconMap[settings.feature_2_icon as keyof typeof iconMap] || iconMap.Clock,
        title: settings.feature_2_title || 'Quick Service',
        description: settings.feature_2_description || 'Efficient service within 15 minutes'
      },
      {
        icon: iconMap[settings.feature_3_icon as keyof typeof iconMap] || iconMap.Star,
        title: settings.feature_3_title || 'Best Quality',
        description: settings.feature_3_description || 'Award-winning dishes by expert chefs'
      }
    ];
    
    return (
      <div className="h-full bg-white">
        <div className="h-full" style={{ fontFamily: settings.font_family || 'Inter, sans-serif' }}>
          {/* Header Navigation */}
          <header className="bg-white shadow-sm border-b sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold" style={{ color: settings.primary_color || '#f97316' }}>
                    {settings.site_name || 'TastyBites'}
                  </h1>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Menu</a>
                  <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
                </nav>
                <button
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: settings.primary_color || '#f97316' }}
                >
                  Order Now
                </button>
              </div>
            </div>
          </header>

          {/* Hero Section Preview */}
          <div 
            className="relative h-96 bg-cover bg-center"
            style={{
              backgroundImage: `url("${settings.hero_background_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80'}")`
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50" />
            <div className="relative px-6 h-full flex items-center justify-center">
              <div className="text-white text-center max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {settings.hero_title || settings.site_name || 'Experience Fine Dining'}
                </h1>
                <p className="text-xl mb-8 text-gray-200">
                  {settings.hero_subtitle || settings.tagline || 'Discover our exquisite cuisine crafted with passion and tradition.'}
                </p>
                <button
                  className="px-8 py-3 rounded-full text-lg font-semibold hover:opacity-90 transition-opacity"
                  style={{ 
                    backgroundColor: settings.primary_color || '#f97316',
                    color: 'white'
                  }}
                >
                  {settings.hero_cta_text || 'View Menu'}
                </button>
              </div>
            </div>
          </div>

          {/* Features Section Preview */}
          <div className="py-16 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                {settings.features_section_title || 'Why Choose Us'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <div key={index} className="text-center p-6 bg-gray-50 rounded-xl">
                    <div 
                      className="inline-block p-4 rounded-full text-white mb-4"
                      style={{ backgroundColor: settings.primary_color || '#f97316' }}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Popular Dishes Preview */}
          <div className="py-16 px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                {settings.popular_dishes_title || 'Popular Dishes'}
              </h2>
              {selectedDishes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {selectedDishes.map((dish, index) => (
                    <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2">{dish.name}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{dish.description}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-2xl font-bold" style={{ color: settings.primary_color || '#f97316' }}>
                            ₹{dish.price}
                          </p>
                          <button
                            className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: settings.primary_color || '#f97316' }}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-16">
                  <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No popular dishes selected. Choose from your menu items.</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Section Preview */}
          <div className="py-16 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Contact Us
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-xl font-semibold mb-6">Get in Touch</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 mr-3" style={{ color: settings.primary_color || '#f97316' }} />
                      <span>{settings.contact_phone || '+91 98765 43210'}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-3" style={{ color: settings.primary_color || '#f97316' }} />
                      <span>{settings.contact_email || 'info@tastybites.com'}</span>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 mr-3 mt-1" style={{ color: settings.primary_color || '#f97316' }} />
                      <span>{settings.contact_address || '123 Food Street, Gourmet City, FC 12345'}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-3" style={{ color: settings.primary_color || '#f97316' }} />
                      <span>{settings.hours_mon_fri || 'Mon-Fri: 9:00 AM - 10:00 PM'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-6">Follow Us</h3>
                  <div className="flex space-x-4">
                    {settings.facebook_url && (
                      <a href={settings.facebook_url} className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {settings.instagram_url && (
                      <a href={settings.instagram_url} className="p-3 rounded-full bg-pink-600 text-white hover:bg-pink-700 transition-colors">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {settings.twitter_url && (
                      <a href={settings.twitter_url} className="p-3 rounded-full bg-blue-400 text-white hover:bg-blue-500 transition-colors">
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                    {settings.linkedin_url && (
                      <a href={settings.linkedin_url} className="p-3 rounded-full bg-blue-700 text-white hover:bg-blue-800 transition-colors">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-gray-900 text-white py-12 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                  <h3 className="text-2xl font-bold mb-4" style={{ color: settings.primary_color || '#f97316' }}>
                    {settings.site_name || 'TastyBites'}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {settings.tagline || 'Delicious food delivered to your doorstep with love and care.'}
                  </p>
                  <p className="text-sm text-gray-400">
                    © 2024 {settings.site_name || 'TastyBites'}. All rights reserved.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Quick Links</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Menu</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Contact Info</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>{settings.contact_phone || '+91 98765 43210'}</li>
                    <li>{settings.contact_email || 'info@tastybites.com'}</li>
                    <li>{settings.hours_mon_fri || 'Mon-Fri: 9:00 AM - 10:00 PM'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-full bg-gray-50">
      {/* Settings Panel */}
      <div className="flex-1 max-w-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Website Settings</h1>
              <p className="text-gray-600 mt-1">Customize your restaurant's online presence</p>
            </div>
            
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Eye className="w-5 h-5 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => guardAction(() => handleSave())}
                disabled={isSaving || isGuest}
                className="flex items-center px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span className="ml-2 hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <Upload className="w-5 h-5 mr-2 text-orange-500" />
                      Brand Settings
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Restaurant Logo
                        </label>
                        <div className="flex items-center space-x-4">
                          {settings.logo_url && (
                            <img
                              src={settings.logo_url}
                              alt="Current Logo"
                              className="w-16 h-16 object-contain border rounded"
                            />
                          )}                          <ImageUpload
                            onUpload={handleLogoUpload}
                            currentImageUrl={settings.logo_url}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Restaurant Name
                        </label>
                        <input
                          key="site_name_input"
                          type="text"
                          value={settings.site_name || ''}
                          onChange={(e) => updateSettings({ site_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter restaurant name"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tagline
                        </label>
                        <input
                          key="tagline_input"
                          type="text"
                          value={settings.tagline || ''}
                          onChange={(e) => updateSettings({ tagline: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter restaurant tagline"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}              {/* Hero Section Tab */}
              {activeTab === 'hero' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <Image className="w-5 h-5 mr-2 text-orange-500" />
                      Hero Section Settings
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Background Image
                        </label>
                        <ImageUpload
                          onUpload={(url) => updateSettings({ hero_background_image: url })}
                          currentImageUrl={settings.hero_background_image}
                          folder="hero"
                          label="Upload Hero Background"
                          aspectRatio="landscape"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hero Title
                        </label>
                        <input
                          key="hero_title_input"
                          type="text"
                          value={settings.hero_title || ''}
                          onChange={(e) => updateSettings({ hero_title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Experience Fine Dining"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hero Subtitle
                        </label>
                        <textarea
                          key="hero_subtitle_input"
                          value={settings.hero_subtitle || ''}
                          onChange={(e) => updateSettings({ hero_subtitle: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          rows={3}
                          placeholder="Discover our exquisite cuisine and exceptional service"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Call-to-Action Button Text
                        </label>
                        <input
                          type="text"
                          value={settings.hero_cta_text || ''}
                          onChange={(e) => updateSettings({ hero_cta_text: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="View Menu"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Tab */}
              {activeTab === 'features' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-orange-500" />
                      Features Section
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={settings.features_section_title || ''}
                          onChange={(e) => updateSettings({ features_section_title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Why Choose Us"
                        />
                      </div>

                      {/* Feature 1 */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-3">Feature 1</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Icon
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {[
                                { value: 'UtensilsCrossed', icon: <UtensilsCrossed className="w-5 h-5" /> },
                                { value: 'Clock', icon: <Clock className="w-5 h-5" /> },
                                { value: 'Star', icon: <Star className="w-5 h-5" /> },
                                { value: 'ChefHat', icon: <ChefHat className="w-5 h-5" /> },
                                { value: 'Heart', icon: <Heart className="w-5 h-5" /> },
                                { value: 'Award', icon: <Award className="w-5 h-5" /> }
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => updateSettings({ feature_1_icon: option.value })}
                                  className={`p-2 border rounded-md ${
                                    settings.feature_1_icon === option.value
                                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {option.icon}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Title
                            </label>
                            <input
                              type="text"
                              value={settings.feature_1_title || ''}
                              onChange={(e) => updateSettings({ feature_1_title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Fresh Ingredients"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={settings.feature_1_description || ''}
                              onChange={(e) => updateSettings({ feature_1_description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              rows={2}
                              placeholder="We use only the finest ingredients"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Feature 2 */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-3">Feature 2</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Icon
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {[
                                { value: 'UtensilsCrossed', icon: <UtensilsCrossed className="w-5 h-5" /> },
                                { value: 'Clock', icon: <Clock className="w-5 h-5" /> },
                                { value: 'Star', icon: <Star className="w-5 h-5" /> },
                                { value: 'ChefHat', icon: <ChefHat className="w-5 h-5" /> },
                                { value: 'Heart', icon: <Heart className="w-5 h-5" /> },
                                { value: 'Award', icon: <Award className="w-5 h-5" /> }
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => updateSettings({ feature_2_icon: option.value })}
                                  className={`p-2 border rounded-md ${
                                    settings.feature_2_icon === option.value
                                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {option.icon}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Title
                            </label>
                            <input
                              type="text"
                              value={settings.feature_2_title || ''}
                              onChange={(e) => updateSettings({ feature_2_title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Quick Service"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={settings.feature_2_description || ''}
                              onChange={(e) => updateSettings({ feature_2_description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              rows={2}
                              placeholder="Efficient service within 15 minutes"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Feature 3 */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-3">Feature 3</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Icon
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              {[
                                { value: 'UtensilsCrossed', icon: <UtensilsCrossed className="w-5 h-5" /> },
                                { value: 'Clock', icon: <Clock className="w-5 h-5" /> },
                                { value: 'Star', icon: <Star className="w-5 h-5" /> },
                                { value: 'ChefHat', icon: <ChefHat className="w-5 h-5" /> },
                                { value: 'Heart', icon: <Heart className="w-5 h-5" /> },
                                { value: 'Award', icon: <Award className="w-5 h-5" /> }
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => updateSettings({ feature_3_icon: option.value })}
                                  className={`p-2 border rounded-md ${
                                    settings.feature_3_icon === option.value
                                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {option.icon}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Title
                            </label>
                            <input
                              type="text"
                              value={settings.feature_3_title || ''}
                              onChange={(e) => updateSettings({ feature_3_title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              placeholder="Best Quality"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={settings.feature_3_description || ''}
                              onChange={(e) => updateSettings({ feature_3_description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                              rows={2}
                              placeholder="Award-winning dishes by expert chefs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Popular Dishes Tab */}
              {activeTab === 'dishes' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <UtensilsCrossed className="w-5 h-5 mr-2 text-orange-500" />
                      Popular Dishes Section
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={settings.popular_dishes_title || ''}
                          onChange={(e) => updateSettings({ popular_dishes_title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Popular Dishes"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Selected Dishes ({selectedDishes.length}/3)
                          </label>                          <button
                            onClick={handleOpenMenuSelector}
                            className="flex items-center px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Select Dishes
                          </button>
                        </div>
                        
                        {selectedDishes.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {selectedDishes.map((dish) => (
                              <div key={dish.id} className="relative bg-gray-50 rounded-lg p-3">
                                <button
                                  onClick={() => handleDishSelection(dish)}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <img
                                  src={dish.image}
                                  alt={dish.name}
                                  className="w-full h-24 object-cover rounded mb-2"
                                />
                                <h4 className="font-medium text-sm">{dish.name}</h4>
                                <p className="text-xs text-gray-600 mb-1">{dish.description}</p>
                                <p className="text-sm font-bold text-orange-500">₹{dish.price}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                            <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p>No dishes selected</p>
                            <p className="text-sm">Click "Select Dishes" to choose up to 3 popular dishes</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact & Social Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <Phone className="w-5 h-5 mr-2 text-orange-500" />
                      Contact Information
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={settings.contact_phone || ''}
                          onChange={(e) => updateSettings({ contact_phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="+91 98765 43210"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={settings.contact_email || ''}
                          onChange={(e) => updateSettings({ contact_email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="info@restaurant.com"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <textarea
                          value={settings.contact_address || ''}
                          onChange={(e) => updateSettings({ contact_address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          rows={3}
                          placeholder="123 Restaurant Street, City, State, ZIP"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opening Hours (Mon-Fri)
                        </label>
                        <input
                          type="text"
                          value={settings.hours_mon_fri || ''}
                          onChange={(e) => updateSettings({ hours_mon_fri: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Mon-Fri: 9:00 AM - 10:00 PM"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4">Social Media Links</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Facebook URL
                        </label>
                        <input
                          type="url"
                          value={settings.facebook_url || ''}
                          onChange={(e) => updateSettings({ facebook_url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="https://facebook.com/yourrestaurant"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instagram URL
                        </label>
                        <input
                          type="url"
                          value={settings.instagram_url || ''}
                          onChange={(e) => updateSettings({ instagram_url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="https://instagram.com/yourrestaurant"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Twitter URL
                        </label>
                        <input
                          type="url"
                          value={settings.twitter_url || ''}
                          onChange={(e) => updateSettings({ twitter_url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="https://twitter.com/yourrestaurant"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          LinkedIn URL
                        </label>
                        <input
                          type="url"
                          value={settings.linkedin_url || ''}
                          onChange={(e) => updateSettings({ linkedin_url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="https://linkedin.com/company/yourrestaurant"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Styling Tab */}
              {activeTab === 'style' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <Palette className="w-5 h-5 mr-2 text-orange-500" />
                      Color Scheme
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Color
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={settings.primary_color || '#f97316'}
                            onChange={(e) => updateSettings({ primary_color: e.target.value })}
                            className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.primary_color || '#f97316'}
                            onChange={(e) => updateSettings({ primary_color: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="#f97316"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          This color will be used for buttons, links, and accent elements
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color Presets
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            { name: 'Orange', color: '#f97316' },
                            { name: 'Red', color: '#ef4444' },
                            { name: 'Blue', color: '#3b82f6' },
                            { name: 'Green', color: '#10b981' },
                            { name: 'Purple', color: '#8b5cf6' },
                            { name: 'Pink', color: '#ec4899' },
                            { name: 'Yellow', color: '#f59e0b' },
                            { name: 'Indigo', color: '#6366f1' },
                            { name: 'Teal', color: '#14b8a6' },
                            { name: 'Gray', color: '#6b7280' },
                            { name: 'Emerald', color: '#059669' },
                            { name: 'Rose', color: '#f43f5e' }
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => updateSettings({ primary_color: preset.color })}
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                                settings.primary_color === preset.color
                                  ? 'border-gray-800 scale-110'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: preset.color }}
                              title={preset.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4">Typography</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font Family
                        </label>
                        <select
                          value={settings.font_family || 'Inter'}
                          onChange={(e) => updateSettings({ font_family: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="Inter">Inter (Default)</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open Sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Montserrat">Montserrat</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>      {/* Preview Panel */}
      {showPreview && (
        <div className="w-1/2 border-l bg-white flex flex-col sticky top-0 h-[calc(100vh-64px)]">
          <div className="p-4 border-b shrink-0">
            <h3 className="text-lg font-semibold">Live Preview</h3>
            <p className="text-sm text-gray-600">See how your changes look on the website</p>
          </div>
          <div className="flex-grow overflow-auto" data-lenis-prevent>
            <WebsitePreview />
          </div>
        </div>
      )}

      {/* Menu Selector Modal */}
      <AnimatePresence>
        {showMenuSelector && <MenuSelector />}
      </AnimatePresence>
    </div>
  );
}

// Wrapper component with context provider
export default function WebsiteSettingsComprehensiveWrapper() {
  return (
    <WebsiteSettingsProvider>
      <WebsiteSettingsComprehensive />
    </WebsiteSettingsProvider>
  );
}
