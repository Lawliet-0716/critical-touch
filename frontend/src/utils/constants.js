// ===============================
// 🌐 ENV CONFIG
// ===============================

// ✅ Use .env values (with fallback)
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "auth_token";

// ===============================
// 👥 ROLES
// ===============================
export const ROLES = {
  PATIENT: "patient",
  DRIVER: "driver",
  POLICE: "police",
  HOSPITAL: "hospital",
};

// ===============================
// 🔐 AUTH ENDPOINTS
// ===============================
export const API_ENDPOINTS = {
  // PATIENT
  PATIENT_SIGNUP: `${API_BASE_URL}/api/auth/patient/signup`,
  PATIENT_SIGNIN: `${API_BASE_URL}/api/auth/patient/signin`,

  // DRIVER
  DRIVER_SIGNUP: `${API_BASE_URL}/api/auth/driver/signup`,
  DRIVER_SIGNIN: `${API_BASE_URL}/api/auth/driver/signin`,

  // POLICE
  POLICE_SIGNUP: `${API_BASE_URL}/api/auth/police/signup`,
  POLICE_SIGNIN: `${API_BASE_URL}/api/auth/police/signin`,

  // HOSPITAL
  HOSPITAL_SIGNUP: `${API_BASE_URL}/api/auth/hospital/signup`,
  HOSPITAL_SIGNIN: `${API_BASE_URL}/api/auth/hospital/signin`,
};

// ===============================
// 🔄 LOGIN TYPES (Optional)
// ===============================
export const LOGIN_TYPES = {
  EMAIL: "email",
  UHID: "uhid",
};
