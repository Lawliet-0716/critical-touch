import { Routes, Route } from "react-router-dom";

import RoleSelection from "../pages/common/RoleSelection";

import PatientLogin from "../pages/patient/PatientLogin";
import PatientSignup from "../pages/patient/PatientSignup";
import PatientDashboard from "../pages/patient/PatientDashboard";

import DriverLogin from "../pages/driver/DriverLogin";
import DriverSignup from "../pages/driver/DriverSignup";
import DriverDashboard from "../pages/driver/DriverDashboard";

import PoliceLogin from "../pages/police/PoliceLogin";
import PoliceSignup from "../pages/police/PoliceSignup";
import PoliceDashboard from "../pages/police/PoliceDashboard";

import HospitalLogin from "../pages/hospital/HospitalLogin";
import HospitalSignup from "../pages/hospital/HospitalSignup";
import HospitalDashboard from "../pages/hospital/HospitalDashboard";

// ✅ ADD THIS IMPORT
import EditHospital from "../pages/hospital/EditHospital";

import EmergencyPage from "../pages/patient/EmergencyPage";
import DriverEmergencyPage from "../pages/driver/DriverEmergencyPage";

import PreBookingPage from "../pages/patient/PreBookingPage";

import ProtectedRoute from "../components/ProtectedRoute";

import VideoConsult from "../components/VideoConsult";

import BookConsultation from "../pages/patient/BookConsultation";
import AIPage from "../pages/patient/AiPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />

      <Route path="/patient/login" element={<PatientLogin />} />
      <Route path="/patient/signup" element={<PatientSignup />} />

      <Route path="/driver/signup" element={<DriverSignup />} />
      <Route path="/driver/login" element={<DriverLogin />} />

      <Route path="/police/login" element={<PoliceLogin />} />
      <Route path="/police/signup" element={<PoliceSignup />} />

      <Route path="/hospital/login" element={<HospitalLogin />} />
      <Route path="/hospital/signup" element={<HospitalSignup />} />

      {/* ✅ EDIT PAGE */}
      <Route
        path="/hospital/edit"
        element={
          <ProtectedRoute role="hospital">
            <EditHospital />
          </ProtectedRoute>
        }
      />

      {/* DASHBOARDS */}
      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute role="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/dashboard"
        element={
          <ProtectedRoute role="driver">
            <DriverDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/police/dashboard"
        element={
          <ProtectedRoute role="police">
            <PoliceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/dashboard"
        element={
          <ProtectedRoute role="hospital">
            <HospitalDashboard />
          </ProtectedRoute>
        }
      />

      {/* EMERGENCY */}
      <Route
        path="/patient/emergency"
        element={
          <ProtectedRoute role="patient">
            <EmergencyPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/emergency"
        element={
          <ProtectedRoute role="driver">
            <DriverEmergencyPage />
          </ProtectedRoute>
        }
      />

      {/* PREBOOK */}
      <Route
        path="/patient/prebook"
        element={
          <ProtectedRoute role="patient">
            <PreBookingPage />
          </ProtectedRoute>
        }
      />

      {/* CONSULTATION */}
      <Route path="/consultation/:id" element={<VideoConsult />} />
      <Route path="/consultation/book" element={<BookConsultation />} />
      <Route path="/patient/ai" element={<AIPage />} />
    </Routes>
  );
}
