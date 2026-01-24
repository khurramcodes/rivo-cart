export const toIsoStartDate = (date: string) =>
  new Date(`${date}T00:00:00.000Z`).toISOString();

export const toIsoEndDate = (date: string) =>
  new Date(`${date}T23:59:59.999Z`).toISOString();
