const mongoose = require("mongoose");

const dayHoursSchema = new mongoose.Schema(
  {
    weekday: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun
    isOpen: { type: Boolean, default: true },
    openMinutes: { type: Number, default: 11 * 60 },
    closeMinutes: { type: Number, default: 22 * 60 },
    slotDurationMinutes: { type: Number, default: 90 },
  },
  { _id: false }
);

const weeklyScheduleSchema = new mongoose.Schema(
  {
    days: {
      type: [dayHoursSchema],
      default: () =>
        Array.from({ length: 7 }, (_, weekday) => ({
          weekday,
          isOpen: true,
          openMinutes: 11 * 60,
          closeMinutes: 22 * 60,
          slotDurationMinutes: 90,
        })),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeeklySchedule", weeklyScheduleSchema);
