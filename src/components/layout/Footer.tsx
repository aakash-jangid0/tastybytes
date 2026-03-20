import React from 'react';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Clock, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';

function Footer() {
  const { settings } = useWebsiteSettings();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand and Social Media */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {settings.logo_url && (
                <img 
                  src={settings.logo_url} 
                  alt={settings.site_name} 
                  className="h-8 w-8 object-contain"
                />
              )}
              <h3 className="text-xl font-bold text-white">
                {settings.site_name}
              </h3>
            </div>
            <p className="mb-4 text-sm">{settings.tagline}</p>
            <div className="flex space-x-4">
              {settings.facebook_url && (
                <a href={settings.facebook_url} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.twitter_url && (
                <a href={settings.twitter_url} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.youtube_url && (
                <a href={settings.youtube_url} className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/menu" className="hover:text-white transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  Login / Sign Up
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Opening Hours */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Opening Hours</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{settings.hours_mon_fri}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{settings.hours_sat}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{settings.hours_sun}</span>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              {settings.contact_address && (
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{settings.contact_address}</span>
                </li>
              )}
              {settings.contact_phone && (
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <a href={`tel:${settings.contact_phone}`} className="hover:text-white transition-colors">
                    {settings.contact_phone}
                  </a>
                </li>
              )}
              {settings.contact_email && (
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <a href={`mailto:${settings.contact_email}`} className="hover:text-white transition-colors">
                    {settings.contact_email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} {settings.site_name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;