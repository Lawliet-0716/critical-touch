// src/utils/decodeToken.js

import { jwtDecode } from "jwt-decode";

export const decodeToken = (token) => {
  try {
    const decoded = jwtDecode(token);

    // ⏰ check expiry
    if (decoded?.exp * 1000 < Date.now()) {
      return null;
    }

    // ✅ must include required claims
    if (!decoded?.id || !decoded?.role) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
};
