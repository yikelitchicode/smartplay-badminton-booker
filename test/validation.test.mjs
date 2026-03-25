import assert from 'node:assert/strict';
import { validateAvailabilityQuery } from '../src/utils/validation.js';

function ok(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

ok('accepts valid query', () => {
  const result = validateAvailabilityQuery({ date: '2026-03-25', startTime: '09:00', endTime: '10:00' });
  assert.equal(result.date, '2026-03-25');
});

ok('rejects missing date', () => {
  assert.throws(() => validateAvailabilityQuery({}), /date is required/);
});

ok('rejects invalid time range', () => {
  assert.throws(() => validateAvailabilityQuery({ date: '2026-03-25', startTime: '10:00', endTime: '09:00' }), /earlier than endTime/);
});
