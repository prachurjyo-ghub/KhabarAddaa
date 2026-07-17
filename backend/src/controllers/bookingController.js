const ApiError = require("../utils/ApiError");
const sendSuccess = require("../utils/sendSuccess");
const DiningTable = require("../models/DiningTable");
const Booking = require("../models/Booking");
const WeeklySchedule = require("../models/WeeklySchedule");
const DateOverride = require("../models/DateOverride");
const BlockedDate = require("../models/BlockedDate");

async function getOrCreateSchedule() {
  let schedule = await WeeklySchedule.findOne();
  if (!schedule) schedule = await WeeklySchedule.create({});
  return schedule;
}

function minutesToLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

async function resolveDayHours(dateStr) {
  const blocked = await BlockedDate.findOne({ date: dateStr });
  if (blocked) return { closed: true, reason: blocked.reason || "Blocked" };

  const override = await DateOverride.findOne({ date: dateStr });
  if (override) {
    if (override.isClosed) return { closed: true, reason: override.note || "Closed" };
    return {
      closed: false,
      openMinutes: override.openMinutes,
      closeMinutes: override.closeMinutes,
      slotDurationMinutes: override.slotDurationMinutes || 90,
    };
  }

  const schedule = await getOrCreateSchedule();
  const weekday = new Date(`${dateStr}T12:00:00`).getDay();
  const day = schedule.days.find((d) => d.weekday === weekday);
  if (!day || !day.isOpen) return { closed: true, reason: "Closed" };
  return {
    closed: false,
    openMinutes: day.openMinutes,
    closeMinutes: day.closeMinutes,
    slotDurationMinutes: day.slotDurationMinutes || 90,
  };
}

async function listTables(_req, res) {
  const tables = await DiningTable.find().sort({ name: 1 });
  return sendSuccess(res, { tables });
}

async function createTable(req, res) {
  const { name, seats, status, isActive } = req.body || {};
  if (!name || !seats) throw new ApiError(400, "Name and seats required");
  const table = await DiningTable.create({
    name: String(name).trim(),
    seats: Number(seats),
    status: status || "Available",
    isActive: isActive !== false,
  });
  return sendSuccess(res, { table }, "Created", 201);
}

async function updateTable(req, res) {
  const table = await DiningTable.findById(req.params.id);
  if (!table) throw new ApiError(404, "Table not found");
  const { name, seats, status, isActive } = req.body || {};
  if (name !== undefined) table.name = String(name).trim();
  if (seats !== undefined) table.seats = Number(seats);
  if (status !== undefined) table.status = status;
  if (isActive !== undefined) table.isActive = Boolean(isActive);
  await table.save();
  return sendSuccess(res, { table }, "Updated");
}

async function deleteTable(req, res) {
  const table = await DiningTable.findById(req.params.id);
  if (!table) throw new ApiError(404, "Table not found");
  await table.deleteOne();
  return sendSuccess(res, null, "Deleted");
}

async function publicAvailability(req, res) {
  const { date, guests } = req.query;
  if (!date) throw new ApiError(400, "Date is required");
  const guestCount = Number(guests) || 2;
  if (guestCount >= 13) {
    return sendSuccess(res, {
      largeParty: true,
      managerPhone: process.env.NEXT_PUBLIC_MANAGER_PHONE || "01700000000",
      slots: [],
    });
  }

  const hours = await resolveDayHours(date);
  if (hours.closed) {
    return sendSuccess(res, { closed: true, reason: hours.reason, slots: [] });
  }

  const bookings = await Booking.find({
    date,
    status: { $nin: ["Cancelled", "No Show"] },
  });

  const tables = await DiningTable.find({
    isActive: true,
    status: "Available",
    seats: { $gte: guestCount },
  });

  const slots = [];
  for (
    let start = hours.openMinutes;
    start + hours.slotDurationMinutes <= hours.closeMinutes;
    start += hours.slotDurationMinutes
  ) {
    const end = start + hours.slotDurationMinutes;
    const overlapping = bookings.filter(
      (b) => !(end <= b.startMinutes || start >= b.endMinutes)
    );
    const usedTableIds = new Set(
      overlapping.filter((b) => b.tableId).map((b) => String(b.tableId))
    );
    const freeTables = tables.filter((t) => !usedTableIds.has(String(t._id)));
    slots.push({
      startMinutes: start,
      endMinutes: end,
      label: `${minutesToLabel(start)} – ${minutesToLabel(end)}`,
      available: freeTables.length > 0,
      freeTableCount: freeTables.length,
    });
  }

  return sendSuccess(res, { closed: false, slots, maxOnlineGuests: 12 });
}

async function createPublicBooking(req, res) {
  const body = req.body || {};
  const guests = Number(body.guests);
  if (!body.customerName || !body.customerPhone || !body.date) {
    throw new ApiError(400, "Name, phone, and date are required");
  }
  if (!guests || guests < 1 || guests > 12) {
    throw new ApiError(400, "Guests must be between 1 and 12 for online booking");
  }
  if (body.startMinutes === undefined || body.endMinutes === undefined) {
    throw new ApiError(400, "Slot start/end required");
  }

  const hours = await resolveDayHours(body.date);
  if (hours.closed) throw new ApiError(400, hours.reason || "Restaurant closed");

  const tables = await DiningTable.find({
    isActive: true,
    status: "Available",
    seats: { $gte: guests },
  }).sort({ seats: 1 });

  const overlapping = await Booking.find({
    date: body.date,
    status: { $nin: ["Cancelled", "No Show"] },
    startMinutes: { $lt: body.endMinutes },
    endMinutes: { $gt: body.startMinutes },
  });
  const used = new Set(overlapping.filter((b) => b.tableId).map((b) => String(b.tableId)));
  const free = tables.find((t) => !used.has(String(t._id)));
  if (!free) throw new ApiError(409, "No tables available for this slot");

  const booking = await Booking.create({
    customerId: req.auth?.kind === "customer" ? req.auth.user._id : null,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerEmail: body.customerEmail || "",
    guests,
    date: body.date,
    startMinutes: Number(body.startMinutes),
    endMinutes: Number(body.endMinutes),
    tableId: free._id,
    tableName: free.name,
    note: body.note || "",
    source: "online",
    status: "Pending",
  });

  return sendSuccess(res, { booking }, "Booking created", 201);
}

async function getWeeklySchedule(_req, res) {
  const schedule = await getOrCreateSchedule();
  return sendSuccess(res, { schedule });
}

async function updateWeeklySchedule(req, res) {
  const schedule = await getOrCreateSchedule();
  if (Array.isArray(req.body?.days)) {
    schedule.days = req.body.days;
  }
  await schedule.save();
  return sendSuccess(res, { schedule }, "Schedule updated");
}

async function listDateOverrides(_req, res) {
  const overrides = await DateOverride.find().sort({ date: 1 });
  return sendSuccess(res, { overrides });
}

async function upsertDateOverride(req, res) {
  const body = req.body || {};
  if (!body.date) throw new ApiError(400, "Date required");
  const override = await DateOverride.findOneAndUpdate(
    { date: body.date },
    {
      date: body.date,
      isClosed: Boolean(body.isClosed),
      openMinutes: body.openMinutes ?? null,
      closeMinutes: body.closeMinutes ?? null,
      slotDurationMinutes: body.slotDurationMinutes ?? null,
      note: body.note || "",
    },
    { upsert: true, new: true }
  );
  return sendSuccess(res, { override }, "Saved");
}

async function deleteDateOverride(req, res) {
  await DateOverride.findByIdAndDelete(req.params.id);
  return sendSuccess(res, null, "Deleted");
}

async function listBlockedDates(_req, res) {
  const blockedDates = await BlockedDate.find().sort({ date: 1 });
  return sendSuccess(res, { blockedDates });
}

async function createBlockedDate(req, res) {
  const { date, reason } = req.body || {};
  if (!date) throw new ApiError(400, "Date required");
  const row = await BlockedDate.create({ date, reason: reason || "" });
  return sendSuccess(res, { blockedDate: row }, "Created", 201);
}

async function deleteBlockedDate(req, res) {
  await BlockedDate.findByIdAndDelete(req.params.id);
  return sendSuccess(res, null, "Deleted");
}

async function dayView(req, res) {
  const date = req.query.date;
  if (!date) throw new ApiError(400, "Date required");
  const [tables, bookings, hours] = await Promise.all([
    DiningTable.find({ isActive: true }).sort({ name: 1 }),
    Booking.find({ date }).sort({ startMinutes: 1 }),
    resolveDayHours(date),
  ]);
  return sendSuccess(res, { date, tables, bookings, hours });
}

async function listBookings(req, res) {
  const q = {};
  if (req.query.date) q.date = req.query.date;
  if (req.query.status) q.status = req.query.status;
  const bookings = await Booking.find(q).sort({ date: -1, startMinutes: 1 });
  return sendSuccess(res, { bookings });
}

async function createStaffBooking(req, res) {
  const body = req.body || {};
  if (!body.customerName || !body.customerPhone || !body.date) {
    throw new ApiError(400, "Name, phone, and date required");
  }
  const booking = await Booking.create({
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerEmail: body.customerEmail || "",
    guests: Number(body.guests) || 2,
    date: body.date,
    startMinutes: Number(body.startMinutes) || 0,
    endMinutes: Number(body.endMinutes) || 90,
    tableId: body.tableId || null,
    tableName: body.tableName || "",
    note: body.note || "",
    source: body.source || "admin",
    status: body.status || "Confirmed",
  });
  return sendSuccess(res, { booking }, "Created", 201);
}

async function updateBooking(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found");
  const body = req.body || {};
  for (const key of [
    "customerName",
    "customerPhone",
    "customerEmail",
    "guests",
    "date",
    "startMinutes",
    "endMinutes",
    "tableId",
    "tableName",
    "note",
    "status",
    "source",
  ]) {
    if (body[key] !== undefined) booking[key] = body[key];
  }
  await booking.save();
  return sendSuccess(res, { booking }, "Updated");
}

async function deleteBooking(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found");
  await booking.deleteOne();
  return sendSuccess(res, null, "Deleted");
}

module.exports = {
  listTables,
  createTable,
  updateTable,
  deleteTable,
  publicAvailability,
  createPublicBooking,
  getWeeklySchedule,
  updateWeeklySchedule,
  listDateOverrides,
  upsertDateOverride,
  deleteDateOverride,
  listBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
  dayView,
  listBookings,
  createStaffBooking,
  updateBooking,
  deleteBooking,
};
