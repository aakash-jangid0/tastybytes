import { MenuItem } from '../types/menu';

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Burger',
    description:
      'Juicy beef patty with fresh lettuce, tomatoes, and our special sauce',
    price: 299,
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    category: 'main',
    preparationTime: 15,
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, tomatoes, and basil on our homemade crust',
    price: 349,
    image:
      'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    category: 'main',
    preparationTime: 20,
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Caesar Salad',
    description:
      'Crisp romaine lettuce, parmesan cheese, croutons, and Caesar dressing',
    price: 199,
    image:
      'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80',
    category: 'appetizer',
    preparationTime: 10,
    isAvailable: true,
  },
  {
    id: '4',
    name: 'Chocolate Lava Cake',
    description:
      'Warm chocolate cake with a molten center, served with vanilla ice cream',
    price: 249,
    image:
      'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80',
    category: 'dessert',
    preparationTime: 15,
    isAvailable: true,
  },
  {
    id: '5',
    name: 'Iced Coffee',
    description: 'Cold-brewed coffee served over ice with your choice of milk',
    price: 149,
    image:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
    category: 'beverage',
    preparationTime: 5,
    isAvailable: true,
  },
  {
    id: '6',
    name: 'Garlic Bread',
    description: 'Freshly baked bread with garlic butter and herbs',
    price: 129,
    image:
      'https://images.unsplash.com/photo-1612716391329-28564c434ccc?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fEdhcmxpYyUyMGJyZWFkfGVufDB8fDB8fHww',
    category: 'appetizer',
    preparationTime: 8,
    isAvailable: true,
  },
  {
    id: '7',
    name: 'Chicken Tikka',
    description: 'Tender chicken marinated in spices and grilled to perfection',
    price: 349,
    image:
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80',
    category: 'main',
    preparationTime: 25,
    isAvailable: true,
  },
  {
    id: '8',
    name: 'Strawberry Lassi',
    description: 'Refreshing yogurt drink with fresh strawberry',
    price: 129,
    image:
      'https://images.unsplash.com/photo-1692620609860-be6717812f71?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGFzc2l8ZW58MHx8MHx8fDA%3D',
    category: 'beverage',
    preparationTime: 5,
    isAvailable: true,
  },
  {
    id: '9',
    name: 'Palak Paneer',
    description: 'Cottage cheese cubes in creamy spinach gravy',
    price: 299,
    image:
      'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFsYWslMjBwYW5lZXJ8ZW58MHx8MHx8fDA%3D',
    category: 'main',
    preparationTime: 25,
    isAvailable: true,
  },
  {
    id: '10',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potatoes',
    price: 199,
    image:
      'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8TWFzYWxhJTIwZG9zYXxlbnwwfHwwfHx8MA%3D%3D',
    category: 'main',
    preparationTime: 20,
    isAvailable: true,
  },
  {
    id: '11',
    name: 'Vegetable Biryani',
    description:
      'Fragrant rice cooked with mixed vegetables and aromatic spices',
    price: 299,
    image:
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    category: 'main',
    preparationTime: 35,
    isAvailable: true,
  },
  {
    id: '12',
    name: 'Gulab Jamun',
    description: 'Deep-fried milk solids soaked in sugar syrup',
    price: 149,
    image:
      'https://images.pexels.com/photos/15014919/pexels-photo-15014919/free-photo-of-bowl-of-gulab-jamun.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'dessert',
    preparationTime: 10,
    isAvailable: true,
  },
  {
    id: '13',
    name: 'Rasgulla',
    description: 'Soft cottage cheese balls in sugar syrup',
    price: 149,
    image:
      'https://images.pexels.com/photos/8788869/pexels-photo-8788869.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'dessert',
    preparationTime: 10,
    isAvailable: true,
  },
  {
    id: '14',
    name: 'Masala Chai',
    description: 'Indian spiced tea with milk',
    price: 79,
    image:
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8VGVhfGVufDB8fDB8fHww',
    category: 'beverage',
    preparationTime: 5,
    isAvailable: true,
  },
  {
    id: '15',
    name: 'Fresh Lime Soda',
    description: 'Refreshing lime soda with mint leaves',
    price: 99,
    image:
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    category: 'beverage',
    preparationTime: 5,
    isAvailable: true,
  },
  {
    id: '16',
    name: 'Paneer Tikka',
    description: 'Grilled cottage cheese with peppers and onions',
    price: 299,
    image:
      'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
    category: 'appetizer',
    preparationTime: 20,
    isAvailable: true,
  },
  {
    id: '17',
    name: 'Mushroom Manchurian',
    description: 'Indo-Chinese style crispy mushrooms in spicy sauce',
    price: 249,
    image:
      'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
    category: 'appetizer',
    preparationTime: 20,
    isAvailable: true,
  },
  {
    id: '18',
    name: 'Dal Makhani',
    description: 'Creamy black lentils cooked overnight',
    price: 249,
    image:
      'https://images.pexels.com/photos/19834445/pexels-photo-19834445/free-photo-of-traditional-indian-dish-with-ingredients-on-table.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'main',
    preparationTime: 30,
    isAvailable: true,
  },
  {
    id: '19',
    name: 'Tandoori Roti',
    description: 'Whole wheat bread baked in clay oven',
    price: 49,
    image:
      'https://images.pexels.com/photos/1117862/pexels-photo-1117862.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'main',
    preparationTime: 10,
    isAvailable: true,
  },
  {
    id: '20',
    name: 'Butter Naan',
    description: 'Refined flour bread with butter',
    price: 69,
    image:
      'https://media.istockphoto.com/id/1305516603/photo/shahi-paneer-or-paneer-kadai.webp?a=1&b=1&s=612x612&w=0&k=20&c=7xK8dyQlpro9H__NtnbSNKRRq2l-sGfoUj6IxxA1dX0=',
    category: 'main',
    preparationTime: 10,
    isAvailable: true,
  },
  {
    id: '21',
    name: 'Samosa',
    description: 'Crispy pastry filled with spiced potatoes',
    price: 49,
    image:
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    category: 'appetizer',
    preparationTime: 15,
    isAvailable: true,
  },
  {
    id: '22',
    name: 'Matar Paneer',
    description: 'Cottage cheese and peas in tomato gravy',
    price: 279,
    image:
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8TWF0YXIlMjBwYW5lZXJ8ZW58MHx8MHx8fDA%3D',
    category: 'main',
    preparationTime: 25,
    isAvailable: true,
  },
  {
    id: '23',
    name: 'Malai Kofta',
    description: 'Cottage cheese dumplings in rich creamy gravy',
    price: 299,
    image:
      'https://images.unsplash.com/photo-1606471191009-63994c53433b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWFsYWklMjBrb2Z0YXxlbnwwfHwwfHx8MA%3D%3D',
    category: 'main',
    preparationTime: 30,
    isAvailable: true,
  },
  {
    id: '24',
    name: 'Kadai Paneer',
    description: 'Cottage cheese in spicy bell pepper gravy',
    price: 299,
    image:
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFubmVyJTIwZGlzaHxlbnwwfHwwfHx8MA%3D%3D',
    category: 'main',
    preparationTime: 25,
    isAvailable: true,
  },
  {
    id: '25',
    name: 'Veg Spring Roll',
    description: 'Crispy rolls filled with vegetables',
    price: 199,
    image:
      'https://images.pexels.com/photos/7363745/pexels-photo-7363745.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'appetizer',
    preparationTime: 15,
    isAvailable: true,
  },
  {
    id: '26',
    name: 'Chilli Paneer',
    description: 'Indo-Chinese style spicy cottage cheese',
    price: 299,
    image:
      'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
    category: 'appetizer',
    preparationTime: 20,
    isAvailable: true,
  },
  {
    id: '27',
    name: 'Veg Manchurian',
    description: 'Mixed vegetable dumplings in spicy sauce',
    price: 249,
    image:
      'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
    category: 'appetizer',
    preparationTime: 20,
    isAvailable: true,
  },
  {
    id: '28',
    name: 'Jalebi',
    description: 'Crispy spiral sweets in sugar syrup',
    price: 129,
    image:
      'https://images.pexels.com/photos/8887054/pexels-photo-8887054.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'dessert',
    preparationTime: 15,
    isAvailable: true,
  },
  {
    id: '29',
    name: 'Badam Milk',
    description: 'Almond flavored milk',
    price: 129,
    image:
      'https://images.pexels.com/photos/3556686/pexels-photo-3556686.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'beverage',
    preparationTime: 5,
    isAvailable: true,
  },
  {
    id: '30',
    name: 'Fresh Orange Juice',
    description: 'Freshly squeezed orange juice',
    price: 149,
    image:
      'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
    category: 'beverage',
    preparationTime: 5,
    isAvailable: true,
  },
  {
    id: '31',
    name: 'Watermelon Juice',
    description: 'Fresh watermelon juice',
    price: 129,
    image:
      'https://images.pexels.com/photos/1337825/pexels-photo-1337825.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'beverage',
    preparationTime: 5,
    isAvailable: true,
  },
  {
    id: '32',
    name: 'Mixed Fruit Juice',
    description: 'Blend of seasonal fruits',
    price: 169,
    image:
      'https://images.pexels.com/photos/16768103/pexels-photo-16768103/free-photo-of-close-up-of-fruit-cocktail.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'beverage',
    preparationTime: 5,
    isAvailable: true,
  },
];
