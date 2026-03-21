import { useGuest } from '../context/GuestContext';
import { toast } from 'react-hot-toast';

export function useGuestGuard() {
  const { isGuest, exitGuestMode } = useGuest();

  const guardAction = (action: () => void) => {
    if (isGuest) {
      toast.error('Please login to perform this action');
      return;
    }
    action();
  };

  return { isGuest, guardAction, exitGuestMode };
}
