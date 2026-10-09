// Comprehensive Pune landmarks for human-friendly location mapping and geocoding
export const PUNE_LANDMARKS = [
  { name: 'Shivaji Nagar Junction', area: 'Shivaji Nagar', lat: 18.5314, lng: 73.8446 },
  { name: 'Fergusson College Road (FC Road)', area: 'Deccan', lat: 18.5246, lng: 73.8415 },
  { name: 'Jangali Maharaj Road (JM Road)', area: 'Shivaji Nagar', lat: 18.5284, lng: 73.8492 },
  { name: 'Deccan Gymkhana & Bus Station', area: 'Deccan', lat: 18.5173, lng: 73.8413 },
  { name: 'Swargate Municipal Interchange', area: 'Swargate', lat: 18.5018, lng: 73.8586 },
  { name: 'Pune Railway Station Central', area: 'Station Road', lat: 18.5289, lng: 73.8744 },
  { name: 'Camp / MG Road Cantonment', area: 'Camp', lat: 18.5140, lng: 73.8785 },
  { name: 'Kothrud Central Depot', area: 'Kothrud', lat: 18.5074, lng: 73.8077 },
  { name: 'Aundh Ward Office & Road', area: 'Aundh', lat: 18.5580, lng: 73.8075 },
  { name: 'Sambhaji Park & Mutha Riverside', area: 'JM Road', lat: 18.5218, lng: 73.8475 },
  { name: 'Model Colony & Deep Bungalow Chowk', area: 'Model Colony', lat: 18.5360, lng: 73.8340 },
  { name: 'Katraj Bypass / Snake Park', area: 'Katraj', lat: 18.4550, lng: 73.8670 },
  { name: 'Viman Nagar IT Corridor', area: 'Viman Nagar', lat: 18.5679, lng: 73.9143 },
  { name: 'Baner Main Road Hub', area: 'Baner', lat: 18.5590, lng: 73.7868 },
  { name: 'Shaniwar Wada Heritage Precinct', area: 'Old City / Kasba', lat: 18.5195, lng: 73.8553 },
  { name: 'Karve Road Paud Phata', area: 'Kothrud', lat: 18.5098, lng: 73.8245 }
];

/**
 * Calculates Euclidean / Haversine distance in kilometers between two GPS points
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 999;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Translates raw GPS latitude/longitude into a reassuring, human-friendly Pune location name
 * without technical coordinate jargon.
 */
export function getFriendlyLocationName(lat, lng, fallback = 'Pune Municipal Ward') {
  if (lat === undefined || lng === undefined || lat === null || lng === null) return fallback;
  const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
  const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;
  if (isNaN(numLat) || isNaN(numLng)) return fallback;

  let closest = null;
  let minDistanceKm = Infinity;

  for (const lm of PUNE_LANDMARKS) {
    const dist = calculateDistanceKm(numLat, numLng, lm.lat, lm.lng);
    if (dist < minDistanceKm) {
      minDistanceKm = dist;
      closest = lm;
    }
  }

  if (closest && minDistanceKm <= 1.8) {
    if (minDistanceKm < 0.3) {
      return `${closest.name}`;
    }
    return `Near ${closest.name} (${closest.area})`;
  }

  if (closest && minDistanceKm <= 3.5) {
    return `${closest.area} Sector, Pune`;
  }

  return `${fallback} (Central Zone)`;
}
