import { DEFAULT_API_BASE_URL } from './constants';
import {
  CustomerUser,
  RiderUser,
  TrackingResponse,
  EnquiryBooking,
  NotificationItem,
  PickupTask,
} from './types';

let currentBaseUrl = DEFAULT_API_BASE_URL;
let authToken: string | null = null;

export const setApiBaseUrl = (url: string) => {
  if (url && url.trim()) {
    currentBaseUrl = url.trim().replace(/\/+$/, '');
  }
};

export const getApiBaseUrl = () => currentBaseUrl;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${currentBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
};

export const NetPackApi = {
  // ─── Public Tracking ──────────────────────────────────────────────────────────
  trackCargo: async (trackingNumber: string): Promise<TrackingResponse> => {
    const encoded = encodeURIComponent(trackingNumber.trim());
    return request<TrackingResponse>(`/api/tracking/${encoded}`);
  },

  // ─── Customer Portal ─────────────────────────────────────────────────────────
  customerLogin: async (email: string, password: string): Promise<{ token: string; customer: CustomerUser }> => {
    return request<{ token: string; customer: CustomerUser }>('/api/customer/customer-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  customerSendCode: async (email: string): Promise<{ message: string; success: boolean }> => {
    return request<{ message: string; success: boolean }>('/api/customer/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  customerVerifyCode: async (email: string, code: string): Promise<{ token: string; customer: CustomerUser }> => {
    return request<{ token: string; customer: CustomerUser }>('/api/customer/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  customerSignup: async (data: Record<string, any>): Promise<{ token: string; customer: CustomerUser }> => {
    return request<{ token: string; customer: CustomerUser }>('/api/customer/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCustomerProfile: async (): Promise<CustomerUser> => {
    return request<CustomerUser>('/api/customer/profile');
  },

  updateCustomerProfile: async (data: Partial<CustomerUser>): Promise<CustomerUser> => {
    return request<CustomerUser>('/api/customer/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  createBooking: async (bookingData: Record<string, any>): Promise<{ message: string; trackingNumber: string; enquiryId: number }> => {
    return request<{ message: string; trackingNumber: string; enquiryId: number }>('/api/customer/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  getMyShipments: async (): Promise<EnquiryBooking[]> => {
    return request<EnquiryBooking[]>('/api/customer/my-shipments');
  },

  getCustomerNotifications: async (): Promise<NotificationItem[]> => {
    return request<NotificationItem[]>('/api/customer/notifications');
  },

  markNotificationRead: async (notificationId: number): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/api/customer/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  // ─── Rider / Pickups Operations ──────────────────────────────────────────────
  riderLogin: async (identifier: string, password: string): Promise<{ token: string; rider: RiderUser }> => {
    return request<{ token: string; rider: RiderUser }>('/api/pickups/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  getRiderPickups: async (statusFilter?: string): Promise<PickupTask[]> => {
    const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    return request<PickupTask[]>(`/api/pickups${q}`);
  },

  getPickupDetail: async (id: number): Promise<PickupTask> => {
    return request<PickupTask>(`/api/pickups/${id}`);
  },

  updatePickupStatus: async (id: number, status: string, notes?: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/api/pickups/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  updateStopStatus: async (pickupId: number, stopId: number, isPickedUp: boolean): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/api/pickups/${pickupId}/stops/${stopId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isPickedUp }),
    });
  },

  submitPickupAndWeigh: async (
    pickupId: number,
    formData: FormData
  ): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/api/pickups/${pickupId}/pickup-and-weigh`, {
      method: 'POST',
      body: formData,
    });
  },
};
