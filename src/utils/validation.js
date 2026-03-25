import { ValidationError } from './errors.js';

export function validateAvailabilityQuery(query = {}) {
  const details = [];
  if (!query.date) details.push('date is required (YYYY-MM-DD)');
  if (query.date && !/^\d{4}-\d{2}-\d{2}$/.test(query.date)) details.push('date must be YYYY-MM-DD');
  if (query.startTime && !/^\d{2}:\d{2}$/.test(query.startTime)) details.push('startTime must be HH:MM');
  if (query.endTime && !/^\d{2}:\d{2}$/.test(query.endTime)) details.push('endTime must be HH:MM');
  if (query.startTime && query.endTime && query.startTime >= query.endTime) details.push('startTime must be earlier than endTime');
  if (details.length) {
    throw new ValidationError(`Invalid availability query: ${details.join('; ')}`, details);
  }
  return query;
}
