import API from "./api";
import { API_ENDPOINTS } from "../utils/constants";

// PATIENT
export const signup = (data) => {
  return API.post(API_ENDPOINTS.PATIENT_SIGNUP, data);
};

export const signin = (data) => {
  return API.post(API_ENDPOINTS.PATIENT_SIGNIN, data);
};

// DRIVER
export const driverSignup = (data) => {
  return API.post(API_ENDPOINTS.DRIVER_SIGNUP, data);
};

export const driverSignin = (data) => {
  return API.post(API_ENDPOINTS.DRIVER_SIGNIN, data);
};

// POLICE
export const policeSignup = (data) =>
  API.post(API_ENDPOINTS.POLICE_SIGNUP, data);

export const policeSignin = (data) =>
  API.post(API_ENDPOINTS.POLICE_SIGNIN, data);

// HOSPITAL
export const hospitalSignup = (data) =>
  API.post(API_ENDPOINTS.HOSPITAL_SIGNUP, data);

export const hospitalSignin = (data) =>
  API.post(API_ENDPOINTS.HOSPITAL_SIGNIN, data);
