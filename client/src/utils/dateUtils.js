export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

export const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

export const isHoliday = (date, holidays = []) => {
  if (!date) return false;
  const dateStr = new Date(date).toISOString().split('T')[0];
  return holidays.some(holiday => 
    dateStr >= holiday.start_date && dateStr <= holiday.end_date
  );
};

export const getHolidayReason = (date, holidays = []) => {
  if (!date) return '';
  const dateStr = new Date(date).toISOString().split('T')[0];
  const holiday = holidays.find(h => 
    dateStr >= h.start_date && dateStr <= h.end_date
  );
  return holiday ? holiday.reason : '';
};