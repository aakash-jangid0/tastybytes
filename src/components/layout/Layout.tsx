import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingCart from '../cart/FloatingCart';
import PhoneRequiredModal from '../auth/PhoneRequiredModal';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
  const { user, role, profilePhone, updateProfilePhone } = useAuth();

  // Show phone popup for logged-in customers without a phone number
  const showPhonePopup = !!user && role === 'customer' && !profilePhone;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <FloatingCart />
      <Footer />
      {showPhonePopup && (
        <PhoneRequiredModal
          isOpen={true}
          userId={user.id}
          onPhoneAdded={updateProfilePhone}
        />
      )}
    </div>
  );
}