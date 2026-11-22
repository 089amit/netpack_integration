import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { CustomerUser, NetPackApi, setAuthToken } from '@netpack/shared';

interface AuthContextType {
  customer: CustomerUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithCode: (email: string, code: string) => Promise<void>;
  signup: (data: Record<string, any>) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const TOKEN_KEY = 'netpack_customer_token';
const USER_KEY = 'netpack_customer_data';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore stored session on startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const savedUser = await SecureStore.getItemAsync(USER_KEY);
        if (savedToken) {
          setToken(savedToken);
          setAuthToken(savedToken);
          if (savedUser) {
            setCustomer(JSON.parse(savedUser));
          }
          // Fetch fresh profile in background
          try {
            const freshUser = await NetPackApi.getCustomerProfile();
            setCustomer(freshUser);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(freshUser));
          } catch {
            // keep cached user
          }
        }
      } catch (err) {
        console.log('Error restoring customer session:', err);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const handleAuthSuccess = async (newToken: string, newCustomer: CustomerUser) => {
    setToken(newToken);
    setCustomer(newCustomer);
    setAuthToken(newToken);
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newCustomer));
    } catch (e) {
      console.log('Error caching token:', e);
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await NetPackApi.customerLogin(email, pass);
    await handleAuthSuccess(res.token, res.customer);
  };

  const loginWithCode = async (email: string, code: string) => {
    const res = await NetPackApi.customerVerifyCode(email, code);
    await handleAuthSuccess(res.token, res.customer);
  };

  const signup = async (data: Record<string, any>) => {
    const res = await NetPackApi.customerSignup(data);
    await handleAuthSuccess(res.token, res.customer);
  };

  const logout = async () => {
    setToken(null);
    setCustomer(null);
    setAuthToken(null);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.log('Error clearing token:', e);
    }
  };

  const refreshProfile = async () => {
    try {
      const freshUser = await NetPackApi.getCustomerProfile();
      setCustomer(freshUser);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(freshUser));
    } catch (e) {
      console.log('Error refreshing profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        isLoading,
        login,
        loginWithCode,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
