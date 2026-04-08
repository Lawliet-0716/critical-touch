import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import AuthProvider from "./context/AuthContext";
import MapProvider from "./components/MapProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MapProvider>
          <div className="flex flex-col min-h-screen">
            {/* 🔝 Navbar */}
            <Navbar />

            <div className="flex-grow">
              <AppRoutes />
            </div>

            {/* 🔻 Footer */}
            <Footer />
          </div>
        </MapProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
