import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RouteContextType {
  isLoginOrRegister: boolean;
  setIsLoginOrRegister: (isLoginOrRegister: boolean) => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const useRouteContext = (): RouteContextType => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRouteContext must be used within a RouteProvider');
  }
  return context;
};

interface RouteProviderProps {
  children: ReactNode;
}

export const RouteProvider: React.FC<RouteProviderProps> = ({ children }) => {
  const [isLoginOrRegister, setIsLoginOrRegister] = useState<boolean>(false);

  return (
    <RouteContext.Provider value={{ isLoginOrRegister, setIsLoginOrRegister }}>
      {children}
    </RouteContext.Provider>
  );
};
