/**
 * @typedef {Object} AvailabilityQuery
 * @property {string} date - YYYY-MM-DD
 * @property {string} [district]
 * @property {string} [venue]
 * @property {string} [activity]
 * @property {string} [startTime] - HH:mm
 * @property {string} [endTime] - HH:mm
 */

/**
 * @typedef {Object} CourtSlot
 * @property {string} venue
 * @property {string} court
 * @property {string} start
 * @property {string} end
 * @property {'available' | 'booked' | 'unknown'} status
 */
