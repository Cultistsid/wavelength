// Nearby places via OpenStreetMap Overpass, centred on Midtown Atlanta (Georgia Tech).
export const ATLANTA = { lat: 33.7756, lon: -84.3963, label: 'Midtown Atlanta' };

export interface Place {
  id: number;
  name: string;
  lat: number;
  lon: number;
  street: string | null;
  kind: string;
  website: string | null;
  distanceMi: number;
}

interface TopicRule {
  match: RegExp;
  filter: string;
  kind: string;
}

// Topic words → Overpass tag filters. Ordered: first match wins.
const RULES: TopicRule[] = [
  { match: /ramen|noodle|\bpho\b|udon/i, filter: '["amenity"~"restaurant|fast_food"]["cuisine"~"ramen|noodle|japanese|vietnamese",i]', kind: 'noodles' },
  { match: /sushi|japanese/i, filter: '["amenity"="restaurant"]["cuisine"~"sushi|japanese",i]', kind: 'sushi' },
  { match: /taco|mexican|burrito/i, filter: '["amenity"~"restaurant|fast_food"]["cuisine"~"mexican|taco",i]', kind: 'tacos' },
  { match: /pizza|italian|pasta/i, filter: '["amenity"="restaurant"]["cuisine"~"pizza|italian",i]', kind: 'pizza' },
  { match: /bbq|barbecue|brisket|wings|nugget|chicken/i, filter: '["amenity"~"restaurant|fast_food"]["cuisine"~"barbecue|bbq|chicken|wings|american",i]', kind: 'bbq and wings' },
  { match: /korean|kbbq|bibimbap/i, filter: '["amenity"="restaurant"]["cuisine"~"korean",i]', kind: 'korean' },
  { match: /indian|curry/i, filter: '["amenity"="restaurant"]["cuisine"~"indian",i]', kind: 'indian' },
  { match: /burger/i, filter: '["amenity"~"restaurant|fast_food"]["cuisine"~"burger",i]', kind: 'burgers' },
  { match: /coffee|cafe|espresso|latte|matcha|study/i, filter: '["amenity"="cafe"]', kind: 'coffee' },
  { match: /beer|brewery|\bbar\b|drinks|cocktail|\bpub\b/i, filter: '["amenity"~"pub|bar|biergarten"]', kind: 'drinks' },
  { match: /dessert|ice cream|boba|bubble tea|bakery|sourdough|bread|pastry/i, filter: '["amenity"~"cafe|ice_cream"]', kind: 'sweets' },
  { match: /climb|boulder/i, filter: '["leisure"~"sports_centre|fitness_centre"]["sport"~"climbing",i]', kind: 'climbing' },
  { match: /gym|lift|workout|fitness/i, filter: '["leisure"="fitness_centre"]', kind: 'gym' },
  { match: /photo|film|camera|\bart\b|museum|gallery|design/i, filter: '["tourism"~"museum|gallery|artwork|viewpoint"]', kind: 'art and photo spots' },
  { match: /\bhik|trail|\brun|walk|\bpark|outdoor|mountain|\bski|nature/i, filter: '["leisure"~"park|nature_reserve"]["name"]', kind: 'park' },
  { match: /never-matches-placeholder/, filter: '["tourism"~"museum|gallery|artwork|viewpoint"]', kind: 'art and photo spots' },
  { match: /book|read|novel/i, filter: '["shop"="books"]', kind: 'bookstore' },
  { match: /game|board game|chess|arcade/i, filter: '["leisure"~"amusement_arcade"]|["shop"="games"]', kind: 'games' },
  { match: /music|concert|vinyl|record|band|show/i, filter: '["amenity"~"music_venue|nightclub"]|["shop"="music"]', kind: 'music' },
  { match: /movie|cinema|theater|theatre/i, filter: '["amenity"~"cinema|theatre"]', kind: 'cinema' },
  { match: /soccer|football|basketball|tennis|sport/i, filter: '["leisure"~"pitch|sports_centre|stadium"]["name"]', kind: 'sports' },
];

const FALLBACK: TopicRule = { match: /.*/, filter: '["amenity"~"cafe|restaurant"]["name"]', kind: 'food and coffee' };

export function ruleFor(topic: string): TopicRule {
  return RULES.find((r) => r.match.test(topic)) ?? FALLBACK;
}

function haversineMi(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Curated Atlanta spots (coordinates approximate to the block) so a plan always lands
// even when public Overpass is slow or down during the demo.
type Curated = [name: string, lat: number, lon: number, street: string, kinds: string];
const CURATED: Curated[] = [
  ['Ton Ton Ramen', 33.7726, -84.3655, '675 Ponce De Leon Ave NE', 'noodles sushi'],
  ['Food Terminal', 33.7788, -84.4102, '1000 Marietta St NW', 'noodles'],
  ['Antico Pizza Napoletana', 33.7832, -84.4053, '1093 Hemphill Ave NW', 'pizza'],
  ['Superica Krog Street', 33.7566, -84.3640, '99 Krog St NE', 'tacos'],
  ['Fox Bros Bar-B-Q', 33.7595, -84.3459, '1238 DeKalb Ave NE', 'bbq and wings'],
  ['Hattie B\'s Hot Chicken', 33.7645, -84.3496, '299 Moreland Ave NE', 'bbq and wings'],
  ['The Vortex Midtown', 33.7803, -84.3835, '878 Peachtree St NE', 'burgers'],
  ['Dancing Goats Coffee Bar', 33.7723, -84.3660, '650 North Ave NE', 'coffee'],
  ['Chrome Yellow Trading Co', 33.7548, -84.3722, '501 Edgewood Ave SE', 'coffee'],
  ['Ladybird Grove & Mess Hall', 33.7597, -84.3577, '684 John Wesley Dobbs Ave NE', 'drinks'],
  ['Jeni\'s Splendid Ice Creams', 33.7847, -84.4118, '1198 Howell Mill Rd NW', 'sweets'],
  ['Georgia Tech CRC Climbing Wall', 33.7755, -84.4034, '750 Ferst Dr NW', 'climbing gym'],
  ['Piedmont Park', 33.7851, -84.3738, '400 Park Dr NE', 'park sports'],
  ['Atlanta BeltLine Eastside Trail', 33.7700, -84.3630, 'Ponce De Leon Ave NE', 'park'],
  ['High Museum of Art', 33.7901, -84.3856, '1280 Peachtree St NE', 'art and photo spots'],
  ['Jackson Street Bridge', 33.7620, -84.3736, 'Jackson St NE', 'art and photo spots'],
  ['A Cappella Books', 33.7597, -84.3540, '208 Haralson Ave NE', 'bookstore'],
  ['Joystick Gamebar', 33.7548, -84.3735, '427 Edgewood Ave SE', 'games'],
  ['Variety Playhouse', 33.7645, -84.3496, '1099 Euclid Ave NE', 'music'],
  ['Criminal Records', 33.7645, -84.3500, '1154 Euclid Ave NE', 'music'],
  ['Plaza Theatre', 33.7728, -84.3550, '1049 Ponce De Leon Ave NE', 'cinema'],
  ['Ponce City Market', 33.7726, -84.3655, '675 Ponce De Leon Ave NE', 'food and coffee sweets'],
  ['Tech Square', 33.7770, -84.3890, '5th St NW', 'food and coffee'],
];

export function curatedPlaces(kind: string, limit = 6): Place[] {
  const pool = CURATED.filter((c) => c[4].includes(kind));
  const list = pool.length ? pool : CURATED.filter((c) => c[4].includes('food and coffee'));
  return list
    .map(([name, lat, lon, street], i) => ({
      id: -1 - i,
      name,
      lat,
      lon,
      street,
      kind,
      website: null,
      distanceMi: haversineMi(ATLANTA.lat, ATLANTA.lon, lat, lon),
    }))
    .sort((a, b) => a.distanceMi - b.distanceMi)
    .slice(0, limit);
}

async function overpass(query: string, timeoutMs: number): Promise<OverpassElement[]> {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Wavelength-hackathon/1.0' },
    body: 'data=' + encodeURIComponent(query),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = (await res.json()) as { elements: OverpassElement[] };
  return data.elements;
}

export async function findPlaces(topic: string, radiusM = 3000, limit = 6): Promise<{ places: Place[]; kind: string; source: 'osm' | 'curated' }> {
  const rule = ruleFor(topic);
  // A filter may contain "|" between two complete tag groups, meaning OR.
  const groups = rule.filter.split('|["').map((g, i) => (i === 0 ? g : '["' + g));
  const around = `(around:${radiusM},${ATLANTA.lat},${ATLANTA.lon})`;
  // Nodes only: cheap and fast; most venues are nodes. Ways (parks) come from the curated list.
  const body = groups.map((g) => `node${g}${around};`).join('');
  const query = `[out:json][timeout:10];(${body});out ${limit * 4};`;

  let elements: OverpassElement[] = [];
  try {
    elements = await overpass(query, 12000);
  } catch (e) {
    console.warn('Overpass failed, using curated list:', e instanceof Error ? e.message : e);
    return { places: curatedPlaces(rule.kind, limit), kind: rule.kind, source: 'curated' };
  }

  const places = elements
    .map((e): Place | null => {
      const lat = e.lat ?? e.center?.lat;
      const lon = e.lon ?? e.center?.lon;
      const name = e.tags?.name;
      if (lat === undefined || lon === undefined || !name) return null;
      return {
        id: e.id,
        name,
        lat,
        lon,
        street: e.tags?.['addr:street'] ? `${e.tags['addr:housenumber'] ?? ''} ${e.tags['addr:street']}`.trim() : null,
        kind: e.tags?.cuisine ?? e.tags?.amenity ?? e.tags?.leisure ?? e.tags?.tourism ?? e.tags?.shop ?? rule.kind,
        website: e.tags?.website ?? null,
        distanceMi: haversineMi(ATLANTA.lat, ATLANTA.lon, lat, lon),
      };
    })
    .filter((p): p is Place => p !== null)
    .sort((a, b) => a.distanceMi - b.distanceMi)
    .filter((p, i, arr) => arr.findIndex((q) => q.name === p.name) === i)
    .slice(0, limit);

  if (places.length === 0) return { places: curatedPlaces(rule.kind, limit), kind: rule.kind, source: 'curated' };
  return { places, kind: rule.kind, source: 'osm' };
}
