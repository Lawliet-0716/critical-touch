import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import api from "../services/api";

export default function VideoConsult() {
  const { id } = useParams(); // consultationId
  const containerRef = useRef(null);

  useEffect(() => {
    const startCall = async () => {
      try {
        // =======================
        // 🔥 GET TOKEN FROM BACKEND
        // =======================
        const res = await api.post("/video/token", {
          consultationId: id,
        });

        const { appID, serverSecret, roomId } = res.data;

        // 🔥 Use logged-in user
        const userId = Date.now().toString();
        const userName = "User_" + userId;

        // =======================
        // 🎥 INIT ZEGO
        // =======================
        if (!containerRef.current) {
          throw new Error("Video container not ready");
        }

        if (!appID || !serverSecret || !roomId) {
          throw new Error("Missing ZEGOCLOUD config (appID/serverSecret/roomId)");
        }

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomId,
          userId,
          userName,
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);

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
      } catch (err) {
        console.error("❌ Video error:", err);
      }
    };

    if (id) startCall();
  }, [id]);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
}
