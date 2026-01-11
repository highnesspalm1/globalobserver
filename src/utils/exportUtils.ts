import type { MapEvent } from '../types/database';

// Export filtered events as GeoJSON
export const exportToGeoJSON = (events: MapEvent[], filename = 'events-export'): void => {
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: events.map((event) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: event.coordinates,
      },
      properties: {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        severity: event.severity,
        eventDate: event.eventDate.toISOString(),
        verified: event.verified,
        sourceUrl: event.sourceUrl,
        tags: event.tags,
      },
    })),
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
  downloadBlob(blob, `${filename}.geojson`);
};

// Export filtered events as CSV
export const exportToCSV = (events: MapEvent[], filename = 'events-export'): void => {
  const headers = [
    'ID',
    'Titel',
    'Beschreibung',
    'Kategorie',
    'Schweregrad',
    'Longitude',
    'Latitude',
    'Datum',
    'Verifiziert',
    'Quelle',
    'Tags',
  ];

  const rows = events.map((event) => [
    event.id,
    escapeCSV(event.title),
    escapeCSV(event.description || ''),
    event.category,
    event.severity,
    event.coordinates[0].toFixed(6),
    event.coordinates[1].toFixed(6),
    event.eventDate.toISOString(),
    event.verified ? 'Ja' : 'Nein',
    event.sourceUrl || '',
    event.tags?.join('; ') || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `${filename}.csv`);
};

// Export as KML for Google Earth
export const exportToKML = (events: MapEvent[], filename = 'events-export'): void => {
  const placemarks = events.map((event) => `
    <Placemark>
      <name>${escapeXML(event.title)}</name>
      <description><![CDATA[
        <p>${escapeXML(event.description || '')}</p>
        <p><strong>Kategorie:</strong> ${event.category}</p>
        <p><strong>Schweregrad:</strong> ${event.severity}</p>
        <p><strong>Datum:</strong> ${event.eventDate.toLocaleDateString('de-DE')}</p>
        ${event.sourceUrl ? `<p><a href="${event.sourceUrl}">Quelle</a></p>` : ''}
      ]]></description>
      <TimeStamp><when>${event.eventDate.toISOString()}</when></TimeStamp>
      <Point>
        <coordinates>${event.coordinates[0]},${event.coordinates[1]},0</coordinates>
      </Point>
      <Style>
        <IconStyle>
          <color>${getSeverityKMLColor(event.severity)}</color>
          <Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon>
        </IconStyle>
      </Style>
    </Placemark>`).join('\n');

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Global Observer Export</name>
    <description>Exportierte Events vom ${new Date().toLocaleDateString('de-DE')}</description>
    ${placemarks}
  </Document>
</kml>`;

  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
  downloadBlob(blob, `${filename}.kml`);
};

// Helper: Download blob as file
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper: Escape CSV special characters
const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

// Helper: Escape XML special characters
const escapeXML = (value: string): string => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Helper: Get KML color for severity (AABBGGRR format)
const getSeverityKMLColor = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'ff1d1ddc'; // Red
    case 'high':
      return 'ff0626dc'; // Dark Red
    case 'medium':
      return 'ff0697d9'; // Orange
    case 'low':
      return 'ff34a316'; // Green
    default:
      return 'ff888888'; // Gray
  }
};

// Get export filename with date
export const getExportFilename = (prefix = 'globalobserver'): string => {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}`;
};
