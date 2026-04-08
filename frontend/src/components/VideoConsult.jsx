import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import api from "../services/api";

export default function VideoConsult() {
  const { id } = useParams(); // consultationId
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const startCall = async () => {
      try {
        setLoading(true);
        setError("");

        // =======================
        // 🔥 GET TOKEN FROM BACKEND
        // =======================
        const res = await api.post("/video/token", {
          consultationId: id,
        });

        const { appID, serverSecret, roomId } = res.data;
        const parsedAppId =
          typeof appID === "number" ? appID : Number.parseInt(String(appID), 10);

        // 🔥 Use logged-in user
        const userId = Date.now().toString();
        const userName = "User_" + userId;

        // =======================
        // 🎥 INIT ZEGO
        // =======================
        if (!containerRef.current) {
          throw new Error("Video container not ready");
        }

        if (!parsedAppId || Number.isNaN(parsedAppId) || !serverSecret || !roomId) {
          throw new Error("Missing ZEGOCLOUD config (appID/serverSecret/roomId)");
        }

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          parsedAppId,
          serverSecret,
          roomId,
          userId,
          userName,
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);

        if (!zp || typeof zp.joinRoom !== "function") {
          throw new Error(
            "Video SDK failed to initialize (invalid kitToken/appID/serverSecret)",
          );
        }

        zp.joinRoom({
          container: containerRef.current,

          sharedLinks: [
            {
              name: "Join Link",
              url: window.location.href,
            },
          ],

          scenario: {
            mode: ZegoUIKitPrebuilt.VideoConference,
          },

          // =======================
          // 🔥 ON LEAVE (COMPLETE CONSULTATION)
          // =======================
          onLeaveRoom: async () => {
            console.log("User left room");

            try {
              await api.put(`/consultation/complete/${id}`);
            } catch (err) {
              console.error("❌ Complete error:", err);
            }

            // 🔥 Redirect based on role
            const role = localStorage.getItem("role");

            if (role === "hospital") {
              window.location.href = "/hospital/dashboard";
            } else {
              window.location.href = "/patient/dashboard";
            }
          },
        });

        setLoading(false);
      } catch (err) {
        console.error("❌ Video error:", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to start video call";
        setError(msg);
        setLoading(false);
      }
    };

    if (id) startCall();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white shadow rounded-xl p-6 max-w-lg w-full">
          <h2 className="text-xl font-semibold mb-2">Unable to join call</h2>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600">
            If you’re self-hosting, ensure the backend has{" "}
            <code className="px-1 py-0.5 bg-gray-100 rounded">
              ZEGO_APP_ID
            </code>{" "}
            and{" "}
            <code className="px-1 py-0.5 bg-gray-100 rounded">
              ZEGO_SERVER_SECRET
            </code>{" "}
            set, and that you’re logged in (token present).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <p className="text-sm text-gray-600">Starting video call...</p>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />
    </div>
  );
}
