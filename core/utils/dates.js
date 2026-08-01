const startOfDay = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfWeek = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

// Returns the lowercase weekday name of `date` resolved in the given IANA
// timezone, e.g. "monday". Falls back to the server timezone when omitted.
const getWeekdayName = (date, timezone) =>
  date
    .toLocaleDateString("en-US", {
      weekday: "long",
      ...(timezone ? { timeZone: timezone } : {}),
    })
    .toLowerCase();

module.exports = { startOfDay, endOfDay, startOfWeek, startOfMonth, endOfMonth, getWeekdayName };
