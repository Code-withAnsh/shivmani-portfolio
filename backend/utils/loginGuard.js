// Admin login lock: after 4 wrong passwords from the same IP, that IP is locked out for 30 seconds.
// Kept in memory, so a server restart clears it.
const MAX_FAILS = 4;
const LOCK_MS = 30 * 1000;

const attempts = new Map(); // ip -> { fails, lockedUntil }

// Seconds left on the lock (0 when the IP may try again)
const lockedFor = (ip) => {
  const entry = attempts.get(ip);
  if (!entry || !entry.lockedUntil) return 0;
  const left = entry.lockedUntil - Date.now();
  if (left > 0) return Math.ceil(left / 1000);
  attempts.delete(ip);
  return 0;
};

// Records a wrong password. Returns how many tries are left before the lock.
const recordFail = (ip) => {
  const entry = attempts.get(ip) || { fails: 0, lockedUntil: 0 };
  entry.fails += 1;
  if (entry.fails >= MAX_FAILS) {
    entry.lockedUntil = Date.now() + LOCK_MS;
    entry.fails = 0;
  }
  attempts.set(ip, entry);
  return entry.lockedUntil ? 0 : MAX_FAILS - entry.fails;
};

const clearFails = (ip) => attempts.delete(ip);

module.exports = { lockedFor, recordFail, clearFails, LOCK_MS };
