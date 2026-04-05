import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Smartphone, Tablet, RefreshCw } from 'lucide-react';
import { WebsiteSettings } from '../../types/websiteSettings';

interface LivePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WebsiteSettings;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const LivePreview: React.FC<LivePreviewProps> = ({ isOpen, onClose, settings }) => {
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getViewportDimensions = () => {
    switch (viewportSize) {
      case 'mobile': return { width: '375px', height: '812px' };
      case 'tablet': return { width: '768px', height: '1024px' };
      default: return { width: '1200px', height: '800px' };
    }
  };

  const refreshPreview = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const renderPreviewContent = () => {
    const dimensions = getViewportDimensions();
    
    return (
      <div 
        className="bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300"
        style={{ 
          width: dimensions.width, 
          height: dimensions.height,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        {/* Preview Header */}
        <div className="bg-gray-100 p-2 flex items-center justify-between border-b">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="ml-2">Preview - {settings.site_name}</span>
          </div>
          <button
            onClick={refreshPreview}
            className={`p-1 hover:bg-gray-200 rounded transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>        {/* Preview Content */}
        <div className="h-full overflow-auto bg-white" data-lenis-prevent>
          {/* Hero Section Preview */}
          <div 
            className="relative h-64 flex items-center justify-center bg-gradient-to-r from-orange-500 to-pink-500"
          >
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="relative text-white text-center px-4">
              <h1 className="text-2xl md:text-4xl font-bold mb-2">
                Welcome to {settings.site_name}
              </h1>
              <p className="text-sm md:text-lg mb-4 opacity-90">
                {settings.tagline || 'Experience fine dining at its best'}
              </p>
              <button 
                className="px-4 py-2 rounded-full text-sm font-semibold transition-colors bg-orange-600 text-white"
              >
                Order Now
              </button>
            </div>
          </div>

          {/* Popular Dishes Section Preview */}
          {settings.popular_dish_ids && settings.popular_dish_ids.length > 0 && (
            <div className="py-12 px-4 bg-gray-50">
              <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">
                  Popular Dishes
                </h2>
                <p className="text-gray-600 mb-8">
                  Check out our most popular dishes
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {settings.popular_dish_ids.slice(0, 3).map((dishId, i) => (
                    <div key={dishId || i} className="bg-white rounded-lg shadow-md p-4">
                      <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                      <h3 className="font-semibold mb-2">Popular Dish {i + 1}</h3>
                      <p className="text-sm text-gray-600">Delicious featured item</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contact Section Preview */}
          <div className="py-12 px-4 bg-gray-50">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600 mb-8">
                Get in touch with us
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {settings.contact_email && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-orange-600">✉</span>
                    </div>
                    <p className="font-semibold">Email</p>
                    <p className="text-sm text-gray-600">{settings.contact_email}</p>
                  </div>
                )}
                {settings.contact_phone && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-orange-600">📞</span>
                    </div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-sm text-gray-600">{settings.contact_phone}</p>
                  </div>
                )}
                {settings.contact_address && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-orange-600">📍</span>
                    </div>
                    <p className="font-semibold">Address</p>
                    <p className="text-sm text-gray-600">{settings.contact_address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Opening Hours Section */}
          <div className="py-12 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-8">Opening Hours</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {settings.hours_mon_fri && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Weekdays</h3>
                    <p className="text-sm text-gray-600">{settings.hours_mon_fri}</p>
                  </div>
                )}
                {settings.hours_sat && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Saturday</h3>
                    <p className="text-sm text-gray-600">{settings.hours_sat}</p>
                  </div>
                )}
                {settings.hours_sun && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Sunday</h3>
                    <p className="text-sm text-gray-600">{settings.hours_sun}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Preview */}
          <footer className="py-8 px-4 bg-gray-100 text-gray-700">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h3 className="font-bold text-lg mb-3">{settings.site_name}</h3>
                  <p className="text-sm">{settings.tagline}</p>
                  <div className="flex gap-3 mt-4">
                    {settings.facebook_url && <div className="w-8 h-8 bg-blue-600 rounded"></div>}
                    {settings.twitter_url && <div className="w-8 h-8 bg-blue-400 rounded"></div>}
                    {settings.instagram_url && <div className="w-8 h-8 bg-pink-600 rounded"></div>}
                    {settings.youtube_url && <div className="w-8 h-8 bg-red-600 rounded"></div>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Quick Links</h4>
                  <ul className="space-y-1 text-sm">
                    <li>Menu</li>
                    <li>About</li>
                    <li>Contact</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Contact Info</h4>
                  <div className="space-y-1 text-sm">
                    {settings.contact_email && <p>{settings.contact_email}</p>}
                    {settings.contact_phone && <p>{settings.contact_phone}</p>}
                    {settings.contact_address && <p>{settings.contact_address}</p>}
                  </div>
                </div>
              </div>
              <div className="border-t pt-4 text-center text-sm border-gray-300">
                <p>&copy; 2024 {settings.site_name}. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Live Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewportSize('desktop')}
                  className={`p-2 rounded ${viewportSize === 'desktop' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewportSize('tablet')}
                  className={`p-2 rounded ${viewportSize === 'tablet' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewportSize('mobile')}
                  className={`p-2 rounded ${viewportSize === 'mobile' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-100 overflow-auto" data-lenis-prevent>
            {renderPreviewContent()}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LivePreview;
