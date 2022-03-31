/**
 * Returns the number of days from d1 to d2.
 *
 * * returns 0 if same day
 * * r > 0 if d2 is after d1
 * * r < 0 if d1 is after d2
 * @param {Date} d1 "startDate"
 * @param {Date} d2 "EndDate"
 * @return {Number} number of days between two dates
 */
export const getDiffInDays = (d1: Date, d2: Date): number => {
  const d1Copy = new Date(d1);
  const d2Copy = new Date(d2);
  // NOTE we want the diff regarding the dates not the absolute one
  d1Copy.setHours(0, 0, 0, 0);
  d2Copy.setHours(0, 0, 0, 0);
  const diffTime: number = d2Copy.getTime() - d1Copy.getTime();
  // NOTE: we use math round to avoid JS math weirdness and summer winter time problems
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};
