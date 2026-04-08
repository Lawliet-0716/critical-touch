const cron = require("node-cron");
const PreBooking = require("../models/PreBooking");
const { findMatchingDrivers } = require("../controllers/matchingController");

module.exports = (io) => {
  cron.schedule("* * * * *", async () => {
    console.log("🔥 Cron running...");

    try {
      // ❌ Auto-cancel dispatched bookings not accepted in time
      // (prevents showing "Cancel" after acceptance, and cleans up stale dispatches)
      const CANCEL_AFTER_MINUTES = 10;
      const cancelBefore = new Date(
        Date.now() - CANCEL_AFTER_MINUTES * 60 * 1000,
      );

      const stale = await PreBooking.find({
        status: "dispatched",
        updatedAt: { $lte: cancelBefore },
        driver: null,
      });

      for (const booking of stale) {
        booking.status = "cancelled";
        await booking.save();
        io.to("driver").emit("preBookingCancelled", booking._id.toString());
      }

      // ✅ Find all pending bookings whose time has come
      const bookings = await PreBooking.find({
        status: "pending",
        scheduledAt: { $lte: new Date() },
      });

      console.log("📦 Bookings to dispatch:", bookings.length);

      for (const booking of bookings) {
        console.log("🚑 Processing booking:", booking._id);

        // 🔍 Find matching drivers
        const drivers = await findMatchingDrivers(booking, io);

        // ✅ Update status
        booking.status = "dispatched";
        await booking.save();

        console.log("✅ Booking dispatched:", booking._id);

        // 📡 Notify drivers (Socket)
        if (!drivers || drivers.length === 0) {
          console.log(
            "⚠️ No matching drivers found, broadcasting to all drivers",
          );
          io.to("driver").emit("newPreBooking", booking);
        } else {
          drivers.forEach((driver) => {
            io.to(driver._id.toString()).emit("newPreBooking", booking);
            console.log("📡 Emitting to:", driver._id.toString());
          });
        }
      }
    } catch (error) {
      console.error("❌ Cron Error:", error);
    }
  });
};
