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

module.exports = { startOfDay, endOfDay, startOfWeek, startOfMonth, endOfMonth };
