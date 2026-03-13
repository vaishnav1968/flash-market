const COORDINATE_PREFIX = "coords:";

function toFiniteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function serializeVendorCoordinates(
  latitude: number | null,
  longitude: number | null
) {
  if (latitude == null || longitude == null) {
    return null;
  }

  return `${COORDINATE_PREFIX}${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

export function parseVendorCoordinates(source: {
  latitude?: unknown;
  longitude?: unknown;
  shop_address?: unknown;
}) {
  const explicitLatitude = toFiniteNumber(source.latitude);
  const explicitLongitude = toFiniteNumber(source.longitude);

  if (explicitLatitude != null && explicitLongitude != null) {
    return {
      latitude: explicitLatitude,
      longitude: explicitLongitude,
    };
  }

  const rawAddress = typeof source.shop_address === "string" ? source.shop_address : "";
  if (!rawAddress.startsWith(COORDINATE_PREFIX)) {
    return {
      latitude: null,
      longitude: null,
    };
  }

  const [latitudeText, longitudeText] = rawAddress
    .slice(COORDINATE_PREFIX.length)
    .split(",");

  return {
    latitude: toFiniteNumber(latitudeText),
    longitude: toFiniteNumber(longitudeText),
  };
}