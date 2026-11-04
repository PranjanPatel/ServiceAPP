export const CATEGORIES = [
  'AC Repair',
  'Plumber',
  'Electrician',
  'Carpenter',
  'Painter',
  'Home Cleaning',
  'Appliance Repair',
  'Pest Control',
];

export const toSlug = (name) => name.toLowerCase().trim().replace(/\s+/g, '-');