// constants/api.ts

// 🔗 Base API & Server Origin Resolver
function resolveBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    const customUrl = String(import.meta.env.VITE_API_URL).trim()
    if (customUrl) {
      return customUrl.replace(/\/+$/, '')
    }
  }
  if (typeof window !== 'undefined') {
    // When running with Vite local dev server (port 5173), point to FastAPI backend on 8000
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:8000/api`
    }
    // In production (Railway single platform or reverse proxy), use same-origin /api
    return `${window.location.origin}/api`
  }
  return 'http://localhost:8000/api'
}

export const BASE_URL = resolveBaseUrl()
export const SERVER_URL = BASE_URL.replace(/\/api\/?$/, '')


// 🚪 Authentication Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN_WITH_EMAIL: `${BASE_URL}/admin/login`,
  REGISTER: `${BASE_URL}/auth/register`,
  FORGOT_PASSWORD: `${BASE_URL}/admin/forgot-password`,
  RESET_PASSWORD: `${BASE_URL}/auth/reset-password`,
  VERIFY_EMAIL: `${BASE_URL}/auth/verify-email`,
  BULK_EMAIL_SENDER: `${BASE_URL}/sendEmail/send-bulk-email`,
  BULK_EMAIL_BROADCAST: `${BASE_URL}/sendEmail/sendBroadcastMail`,
  VALIDATED_TOKEN: `${BASE_URL}/admin/validate-token`,
  CHANGE_PASSWORD_SIMPLE: `${BASE_URL}/user/changepassword`,
}

// 📩 Enquiry / Contact Endpoints
export const ENQUIRY_ENDPOINTS = {
  ALL_ENQUIRY: `${BASE_URL}/enquiry`,
  GET_ALL_ENQUIRIES: `${BASE_URL}/enquiries`,
  DELETE_ENQUIRY: `${BASE_URL}/enquiry/delete`,
  CREATE_ENQUIRY: `${BASE_URL}/enquiry/webenquirycreate`,
  GET_ENQUIRY_ITEM: `${BASE_URL}/enquiry/items`,
  GET_BY_ID_ENQUIRY: `${BASE_URL}/enquiry/get`,
  UPDATE_ENQUIRY: `${BASE_URL}/enquiry/webenquiryupdate`,
  ADD_BOX_ITEM: `${BASE_URL}/enquiry/item/addBoxItem`,
  CHECK_SURCHARGE: `${BASE_URL}/enquiry/surchargecheck`,
  CHECK_EDIT_PERMISSION: (id: number | string) =>
    `${BASE_URL}/enquiry/check-edit-permission/${id}`,
  UPDATE_PICKUP_LOCATIONS: (id: number | string) =>
    `${BASE_URL}/enquiry/update-pickup-locations/${id}`,
  UPDATE_STATUS: (id: number | string) =>
    `${BASE_URL}/enquiry/update-status/${id}`,
}

// 🚚 Pickup Endpoints
export const PICKUP_ENDPOINTS = {
  LIST: `${BASE_URL}/pickups`,
  STATS: `${BASE_URL}/pickups/stats`,
  GET_BY_ID: (id: number | string) => `${BASE_URL}/pickups/${id}`,
  PICKUP_AND_WEIGH: (id: number | string) =>
    `${BASE_URL}/pickups/${id}/pickup-and-weigh`,
}
export const SHIPMENT_ENDPOINT = {
  ALL_SHIPMENTS: `${BASE_URL}/shipments`,
  MULTI_ENQUIRIES_TO_SHIPMENTS: `${BASE_URL}/shipments/from-enquiries`,

  PUSH_TO_SHIPMENT: (enquiryId: number | string) =>
    `${BASE_URL}/shipments/from-enquiry/${enquiryId}`,
  GET_AGENT_SHIPMENT_HAWBNO: (agentId: number | string) =>
    `${BASE_URL}/shipments/getagentshipmentHAWBNO?agentId=${agentId}`,
  BULK_STATUS_CHANGE: `${BASE_URL}/shipments/bulk-status-change`,
  GET_BY_ID: (id: number | string) => `${BASE_URL}/shipments/getById/${id}`,
  BATCH_ADD_NOTE: `${BASE_URL}/shipments/batch-add-note`,
}

// 👤 User Endpoints (example)
export const USER_ENDPOINTS = {
  SIGN_UP: `${BASE_URL}/admin/signup`,
  PROFILE: `${BASE_URL}/users/create`,
  UPDATE_PROFILE: `${BASE_URL}/users/me`,
  CHANGE_PASSWORD: `${BASE_URL}/users/change-password`,
  GET_ALL_CUSTOMER: `${BASE_URL}/customer`,
  UPDATE_CUSTOMER: `${BASE_URL}/customer/updateById`,
  DELETE_CUSTOMER: (id: number) => `${BASE_URL}/customer/${id}`,
  GET_ALL_ADMIN: `${BASE_URL}/admin/users`,
  CREATE_USER: `${BASE_URL}/admin/create`,
  UPDATE_ADMIN_USER: (id: number | string) => `${BASE_URL}/admin/users/${id}`,
  UPDATE_USER: (id: number | string) => `${BASE_URL}/admin/users/${id}`,
  GET_USER: (id: number | string) => `${BASE_URL}/admin/users/${id}`,
  CUSTOMER_HISTORY: (customerId: number) =>
    `${BASE_URL}/customer/history/${customerId}`,
  CUSTOMER_EMAIL: (customerId: number) =>
    `${BASE_URL}/customer/email/${customerId}`,
  MAKE_USER_INACTIVE: (id: number) => `${BASE_URL}/admin/users/${id}/inactive`,
  MAKE_USER_ACTIVE: (id: number) => `${BASE_URL}/admin/users/${id}/active`,
  SEND_ALL_NOTIFCATION: `${BASE_URL}/notification/sendNotification`,
  BULK_NOTIFCATION_SENDER: `${BASE_URL}/notification/send-bulk-notification`,
}
// 🛒 Product / Order Endpoints (optional - for future use)
export const PRODUCT_ENDPOINTS = {
  GET_ALL_PRODUCTS: `${BASE_URL}/products`,
  GET_PRODUCT_BY_ID: (id: string) => `${BASE_URL}/products/${id}`,
  CREATE_PRODUCT: `${BASE_URL}/products`,
}

export const FORWARDING_COMPANY_ENDPOINTS = {
  GET_ALL_COMPANIES: `${BASE_URL}/forwarding-companies`,
  CREATE_COMPANY: `${BASE_URL}/forwarding-companies`,
  UPDATE_COMPANY: (id: number) => `${BASE_URL}/forwarding-companies/${id}`,
  DELETE_COMPANY: (id: number) => `${BASE_URL}/forwarding-companies/${id}`,
  GET_COMPANY_SERVICE: `${BASE_URL}/forwarding-companies/services/company`,
  GET_SERVICES_BY_COMPANY_ID: (id: number) =>
    `${BASE_URL}/forwarding-companies/services/company/${id}`,
  GET_ALL_SERVICES: `${BASE_URL}/forwarding-companies/services`,
  CREATE_SERVICE: `${BASE_URL}/forwarding-companies/services`,
  UPDATE_SERVICE: (id: number) =>
    `${BASE_URL}/forwarding-companies/services/${id}`,
  DELETE_SERVICE: (id: number) =>
    `${BASE_URL}/forwarding-companies/services/${id}`,
  GET_SERVICES_BY_COMPANY: `${BASE_URL}/forwarding-companies/service`,
}

export const MAWB_ENDPOINTS = {
  GET_ALL_MAWBS: `${BASE_URL}/mawbs`,
  CREATE_MAWB: `${BASE_URL}/mawbs`,
  UPDATE_MAWB: (id: number) => `${BASE_URL}/mawbs/update/${id}`,
  LINK_MAWB: `${BASE_URL}/mawbs/linkenquiry`,
  DELETE_MAWB: `${BASE_URL}/mawbs/delete`,
  GET_ENQUIRIES_BY_MAWB: `${BASE_URL}/mawbs/getEnquiriesByMawb`,
  GENERATE_MANIFEST: `${BASE_URL}/manifest/generate-manifest`,
  GENERATE_DATA_SHEET: `${BASE_URL}/manifest/generate-datasheet`,
}

export const AGENTS_ENDPOINTS = {
  GET_ALL_AGENTS: `${BASE_URL}/agents`,
  CREATE_AGENTS: `${BASE_URL}/agents`,
  UPDATE_AGENTS: (id: number) => `${BASE_URL}/agents/${id}`,
  DELETE_AGENT: (id: number) => `${BASE_URL}/agents/${id}`,
}

export const LOCATION_ENDPOINT = {
  GET_ALL_LOCATION: `${BASE_URL}/location/country`,
  GET_COUNTRIES_WITH_RATES: `${BASE_URL}/location/country-with-rates`,
}

export const COUNTRY_ENDPOINT = {
  GET_ALL_COUNTRY: `${BASE_URL}/location/country`,
  GET_COUNTRIES_WITH_RATES: `${BASE_URL}/location/country-with-rates`,
  CREATE_COUNTRY: `${BASE_URL}/location/country`,
  UPDATE_COUNTRY: (id: number) => `${BASE_URL}/location/country/${id}`,
}

export const ZONE_ENDPOINT = {
  GET_ALL_ZONES: `${BASE_URL}/location/zone`,
  CREATE_ZONE: `${BASE_URL}/location/zone`,
  GET_ZONE_BY_ID: (id: number) => `${BASE_URL}/location/zone/${id}`,
  UPDATE_ZONE: (id: number) => `${BASE_URL}/location/zone/${id}`,
  DELETE_ZONE: (id: number) => `${BASE_URL}/location/zone/${id}`,
}
export const RATE_ENDPOINT = {
  CALCULATE: `${BASE_URL}/rate/rate-calculator`,
  IMPORT_EXCEL: `${BASE_URL}/rate/import-excel`,
  GET_RATE_BY_COUNTRY: `${BASE_URL}/rate/countries`,
  GET_RATE_BY_ZONE: `${BASE_URL}/rate/zone`,
  DELETE_RATE: `${BASE_URL}/rate/deleterate`,
  UPDATE_TIA_CHARGE: `${BASE_URL}/rate/updateTIACharge`,
  UPDATE_CUSTOM_CHARGE: `${BASE_URL}/rate/updateCustomCharge`,
  UPDATE_PACKING_CHARGE: `${BASE_URL}/rate/updatePackingCharge`,
  ADD_RATE: `${BASE_URL}/rate/add-rate`,
  UPDATE_RATE: `${BASE_URL}/rate/update-rate`,
  GET_TIA_RATE: `${BASE_URL}/rate/getTIACharge`,
  GET_PACKING_RATE: `${BASE_URL}/rate/getPackingRate`,
  GET_CUSTOM_RATE: `${BASE_URL}/rate/getCustomCharge`,
}

export const USER_ROLE = {
  GET_ALL_ROLES: `${BASE_URL}/userRoles`,
  CREATE_ROLES: `${BASE_URL}/userRoles`,
  DELETE_ROLE: `${BASE_URL}/userRoles`,
}

export const ANALYTICS_ENDPOINTS = {
  DASHBOARD: `${BASE_URL}/analytics/dashboard`,
  MONTHLY_SHIPMENTS: `${BASE_URL}/analytics/monthly-shipments`,
}

export const POLICIES_ENDPOINTS = {
  GET_ALL: `${BASE_URL}/policies`,
  GET_ACTIVE: `${BASE_URL}/policies/active`,
  GET_BY_SLUG: (slug: string) => `${BASE_URL}/policies/${slug}`,
  CREATE: `${BASE_URL}/policies`,
  UPDATE: (id: number | string) => `${BASE_URL}/policies/${id}`,
  DELETE: (id: number | string) => `${BASE_URL}/policies/${id}`,
}

