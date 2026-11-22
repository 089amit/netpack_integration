import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { RiderUser, NetPackApi, setAuthToken } from '@netpack/shared';

interface RiderAuthContextType {
  rider: RiderUser | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const RiderAuthContext = createContext<RiderAuthContextType>({} as RiderAuthContextType);

const RIDER_TOKEN_KEY = 'netpack_rider_token';
const RIDER_DATA_KEY = 'netpack_rider_data';

export const RiderAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rider, setRider] = useState<RiderUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(RIDER_TOKEN_KEY);
        const savedRider = await SecureStore.getItemAsync(RIDER_DATA_KEY);
        if (savedToken && savedRider) {
          setToken(savedToken);
          setAuthToken(savedToken);
          setRider(JSON.parse(savedRider));
        }
      } catch (err) {
        console.log('Error restoring rider session:', err);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (identifier: string, pass: string) => {
    const res = await NetPackApi.riderLogin(identifier, pass);
    setToken(res.token);
    setRider(res.rider);
    setAuthToken(res.token);
    try {
      await SecureStore.setItemAsync(RIDER_TOKEN_KEY, res.token);
      await SecureStore.setItemAsync(RIDER_DATA_KEY, JSON.stringify(res.rider));
    } catch (e) {
      console.log('Error caching rider token:', e);
    }
  };

  const logout = async () => {
    setToken(null);
    setRider(null);
    setAuthToken(null);
    try {
      await SecureStore.deleteItemAsync(RIDER_TOKEN_KEY);
      await SecureStore.deleteItemAsync(RIDER_DATA_KEY);
    } catch (e) {
      console.log('Error clearing rider token:', e);
    }
  };

  return (
    <RiderAuthContext.Provider
      value={{
        rider,
        token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </RiderAuthContext.Provider>
  );
};

export const useRiderAuth = () => useContext(RiderAuthContext);
