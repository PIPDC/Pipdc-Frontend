interface PropertyMapProps {
  address: string;
  title?: string;
  height?: number;
  latitude?: number | null;
  longitude?: number | null;
  zoom?: number;
}

export function PropertyMap({ address, title, height = 400, latitude, longitude, zoom }: PropertyMapProps) {
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number';
  // Coordinates give the most accurate pin. Otherwise fall back to a text query
  // built from the most specific address parts. The z parameter always forces a
  // street-level view so the embed never loads zoomed out to the country.
  const source = hasCoordinates
    ? `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom ?? 16}&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=${zoom ?? 16}&output=embed`;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
      <iframe
        src={source}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        title={title ?? 'Property location'}
        className="block w-full"
      />
    </div>
  );
}