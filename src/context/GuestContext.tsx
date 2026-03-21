import React, { createContext, useContext } from 'react';

interface GuestContextType {
  isGuest: boolean;
  exitGuestMode: () => void;
}

const GuestContext = createContext<GuestContextType>({
  isGuest: false,
  exitGuestMode: () => {},
});

export function GuestProvider({
  children,
  isGuest,
  exitGuestMode,
}: {
  children: React.ReactNode;
  isGuest: boolean;
  exitGuestMode: () => void;
}) {
  return (
    <GuestContext.Provider value={{ isGuest, exitGuestMode }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  return useContext(GuestContext);
}
