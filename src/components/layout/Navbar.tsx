import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu as MenuIcon, LogOut, Clock, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWebsiteSettings } from '../../context/WebsiteSettingsContext';
import { motion, AnimatePresence } from 'framer-motion';

function Navbar() {
  const { cartItems } = useCart();
  const { user, signOut } = useAuth();
  const { settings } = useWebsiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
      setIsScrolled(currentScrollPos > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  const handleLogout = () => {
    signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  const menuItems = [
    { path: '/', label: 'Home' },
    { path: '/menu', label: 'Menu' },
    ...(user ? [{ path: '/orders', label: 'Orders', icon: Clock }] : []),
  ];

  return (
    <motion.nav
      initial={false}
      animate={{
        y: visible ? 0 : -100,
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 1)',
      }}
      transition={{ duration: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg ${
        isScrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="flex items-center gap-3">
              {settings.logo_url && (
                <img 
                  src={settings.logo_url} 
                  alt={settings.site_name} 
                  className="h-8 w-8 object-contain"
                />
              )}
              <span className="text-2xl font-bold text-orange-500">
                {settings.site_name || 'TastyBites'}
              </span>
            </Link>
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden p-2 -mr-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isMenuOpen ? 'close' : 'menu'}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative text-gray-700 hover:text-orange-500 transition-colors ${
                  location.pathname === item.path ? 'text-orange-500' : ''
                }`}
              >
                {item.icon ? (
                  <item.icon className="h-6 w-6" />
                ) : (
                  <span>{item.label}</span>
                )}
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500"
                  />
                )}
              </Link>
            ))}

            {/* Cart Icon */}
            <Link to="/cart" className="relative text-gray-700 hover:text-orange-500 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              <AnimatePresence>
                {cartItems.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                  >
                    {cartItems.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{user.user_metadata?.name || user.email}</span>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-orange-500 transition-colors"
                >
                  <LogOut className="h-6 w-6" />
                </motion.button>
              </div>
            ) : (
              <Link to="/auth" className="text-gray-700 hover:text-orange-500 transition-colors">
                <User className="h-6 w-6" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden bg-white"
            >
              <div className="py-4 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-orange-50 text-orange-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.label}</span>
                  </Link>
                ))}

                <Link
                  to="/cart"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <span className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Cart</span>
                  </span>
                  {cartItems.length > 0 && (
                    <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                      {cartItems.length}
                    </span>
                  )}
                </Link>

                {user ? (
                  <>
                    <div className="px-4 py-3 text-gray-700">
                      {user.user_metadata?.name || user.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-5 w-5" />
                    <span>Login / Sign Up</span>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

export default Navbar;