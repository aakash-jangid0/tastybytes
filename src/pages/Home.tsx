import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Clock, Star, ArrowRight, ChefHat, Heart, Award } from 'lucide-react';
import PageTransition from '../components/common/PageTransition';
import { motion } from 'framer-motion';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { useMenuItems } from '../hooks/useMenuItems';

// Spring transition for Apple-style feel
const spring = { type: 'spring' as const, stiffness: 100, damping: 25 };

// Icon mapping for features
const iconMap = {
  UtensilsCrossed: <UtensilsCrossed className="w-6 h-6" />,
  Clock: <Clock className="w-6 h-6" />,
  Star: <Star className="w-6 h-6" />,
  ChefHat: <ChefHat className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  Award: <Award className="w-6 h-6" />
};

function Home() {
  const { settings } = useWebsiteSettings();
  const { menuItems } = useMenuItems();

  // Get dynamic features from settings or use defaults
  const features = [
    {
      icon: iconMap[settings.feature_1_icon as keyof typeof iconMap] || iconMap.UtensilsCrossed,
      title: settings.feature_1_title || 'Fresh Ingredients',
      description: settings.feature_1_description || 'We use only the finest, locally-sourced ingredients'
    },
    {
      icon: iconMap[settings.feature_2_icon as keyof typeof iconMap] || iconMap.Clock,
      title: settings.feature_2_title || 'Quick Service',
      description: settings.feature_2_description || 'Efficient table service within 15 minutes of ordering'
    },
    {
      icon: iconMap[settings.feature_3_icon as keyof typeof iconMap] || iconMap.Star,
      title: settings.feature_3_title || 'Best Quality',
      description: settings.feature_3_description || 'Award-winning dishes prepared by expert chefs'
    }
  ];

  // Get selected popular dishes from menu items, fallback to static dishes
  const popularDishes = settings.popular_dish_ids && settings.popular_dish_ids.length > 0
    ? menuItems.filter(item => settings.popular_dish_ids?.includes(item.id))
    : [
        {
          name: 'Signature Burger',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80',
          price: '₹299',
          description: 'Juicy beef patty with fresh lettuce, tomatoes, and our special sauce'
        },
        {
          name: 'Margherita Pizza',
          image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&q=80',
          price: '₹349',
          description: 'Fresh mozzarella, tomatoes, and basil on our homemade crust'
        },
        {
          name: 'Fresh Pasta',
          image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80',
          price: '₹399',
          description: 'Handmade pasta with your choice of sauce'
        }
      ];

  return (
    <PageTransition>
      <div className="flex flex-col">
        {/* Hero Section */}
        <div
          className="relative h-[80vh] sm:h-[600px] bg-cover bg-center"
          style={{
            backgroundImage: `url("${settings.hero_background_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80'}")`
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="relative container mx-auto px-4 h-full flex items-center">
            <div className="text-white max-w-lg">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.1 }}
                className="text-4xl sm:text-5xl font-bold mb-4 leading-tight"
              >
                {settings.hero_title || settings.site_name || 'Experience Fine Dining at Its Best'}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.25 }}
                className="text-lg sm:text-xl mb-8 text-gray-200"
              >
                {settings.hero_subtitle || settings.tagline || 'Discover our exquisite cuisine in an elegant dining atmosphere.'}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.4 }}
              >
                <Link
                  to={settings.hero_cta_link || "/menu"}
                  className="inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold transition-colors"
                  style={{
                    backgroundColor: settings.primary_color || '#f97316',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = settings.secondary_color || '#fb923c';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = settings.primary_color || '#f97316';
                  }}
                >
                  {settings.hero_cta_text || 'View Menu'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-12 sm:py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={spring}
              className="text-2xl sm:text-3xl font-bold text-center mb-12"
            >
              {settings.features_section_title || 'Why Choose Us'}
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 25, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ ...spring, delay: index * 0.15 }}
                  className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div
                    className="inline-block p-3 rounded-full text-white mb-4"
                    style={{ backgroundColor: settings.primary_color || '#f97316' }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Dishes Section */}
        <div className="py-12 sm:py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={spring}
              className="text-2xl sm:text-3xl font-bold text-center mb-12"
            >
              {settings.popular_dishes_title || 'Popular Dishes'}
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {popularDishes.map((dish, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 25, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ ...spring, delay: index * 0.12 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 sm:h-56">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-semibold">{dish.name}</h3>
                      <p className="text-white/90 text-sm mt-1">{dish.description}</p>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span
                      className="font-semibold"
                      style={{ color: settings.primary_color || '#f97316' }}
                    >
                      ₹{dish.price}
                    </span>
                    <Link
                      to="/menu"
                      className="inline-flex items-center px-4 py-2 text-white rounded-full text-sm font-semibold transition-colors"
                      style={{ backgroundColor: settings.primary_color || '#f97316' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = settings.secondary_color || '#fb923c';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = settings.primary_color || '#f97316';
                      }}
                    >
                      Order Now
                      <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={spring}
          className="py-12 sm:py-20 text-white"
          style={{ backgroundColor: settings.cta_background_color || '#f97316' }}
        >
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {settings.cta_title || 'Ready to Experience Our Cuisine?'}
            </h2>
            <p className="text-lg mb-8 text-white/90">
              {settings.cta_subtitle || 'Join us for an unforgettable dining experience'}
            </p>
            <Link
              to={settings.cta_button_link || "/menu"}
              className="inline-flex items-center px-8 py-3 bg-white rounded-full text-lg font-semibold transition-colors hover:bg-gray-100"
              style={{ color: settings.cta_background_color || '#f97316' }}
            >
              {settings.cta_button_text || 'View Full Menu'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}

export default Home;
