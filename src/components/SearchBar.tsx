import { useState, useRef, useEffect } from 'react'
import { Search, Menu, MapPin, Navigation, Home, X, Loader } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { ROUTE_WAYPOINTS } from '../lib/mockData'

// ── Geographic constants ──────────────────────────────────────────────────────
// Photon bbox:    minLon, minLat, maxLon, maxLat
const PHOTON_BBOX = '68.285,40.740,68.405,40.815'
// Nominatim viewbox: left(minLon), top(maxLat), right(maxLon), bottom(minLat)
const NOM_VIEWBOX = '68.285,40.815,68.405,40.740'

// ── Transliteration ──────────────────────────────────────────────────────────

const CYR_TO_LAT: [RegExp, string][] = [
  [/дж/gi, 'j'],
  [/ж/gi, 'zh'], [/ш/gi, 'sh'], [/щ/gi, 'sch'], [/ч/gi, 'ch'],
  [/ё/gi, 'yo'], [/ю/gi, 'yu'], [/я/gi, 'ya'], [/[ьъ]/gi, ''],
  [/а/gi, 'a'], [/б/gi, 'b'], [/в/gi, 'v'], [/г/gi, 'g'], [/д/gi, 'd'],
  [/е/gi, 'e'], [/з/gi, 'z'], [/и/gi, 'i'], [/й/gi, 'y'],
  [/к/gi, 'k'], [/л/gi, 'l'], [/м/gi, 'm'], [/н/gi, 'n'],
  [/о/gi, 'o'], [/п/gi, 'p'], [/р/gi, 'r'], [/с/gi, 's'],
  [/т/gi, 't'], [/у/gi, 'u'], [/ф/gi, 'f'], [/х/gi, 'h'],
  [/ц/gi, 'ts'], [/ы/gi, 'y'], [/э/gi, 'e'],
  [/ғ/gi, 'g'], [/қ/gi, 'k'], [/ң/gi, 'n'], [/ө/gi, 'o'],
  [/[ұү]/gi, 'u'], [/і/gi, 'i'], [/ə/gi, 'a'],
]

const LAT_TO_CYR: [RegExp, string][] = [
  [/dzh/gi, 'дж'], [/zh/gi, 'ж'], [/sch/gi, 'щ'], [/sh/gi, 'ш'], [/ch/gi, 'ч'],
  [/yo/gi, 'ё'], [/yu/gi, 'ю'], [/ya/gi, 'я'], [/ts/gi, 'ц'],
  [/a/gi, 'а'], [/b/gi, 'б'], [/v/gi, 'в'], [/g/gi, 'г'], [/d/gi, 'д'],
  [/e/gi, 'е'], [/z/gi, 'з'], [/i/gi, 'и'], [/y/gi, 'й'],
  [/k/gi, 'к'], [/l/gi, 'л'], [/m/gi, 'м'], [/n/gi, 'н'],
  [/o/gi, 'о'], [/p/gi, 'п'], [/r/gi, 'р'], [/s/gi, 'с'],
  [/t/gi, 'т'], [/u/gi, 'у'], [/f/gi, 'ф'], [/h/gi, 'х'],
  [/c/gi, 'к'], [/j/gi, 'дж'],
]

function cyrToLat(text: string): string {
  let r = text.toLowerCase()
  for (const [f, t] of CYR_TO_LAT) r = r.replace(f, t)
  return r
}
function latToCyr(text: string): string {
  let r = text.toLowerCase()
  for (const [f, t] of LAT_TO_CYR) r = r.replace(f, t)
  return r
}
function hasCyrillic(text: string): boolean {
  return /[\u0400-\u04FF]/u.test(text)
}
function normalizeForMatch(text: string): string {
  let s = cyrToLat(text.toLowerCase())
  return s
    .replace(/sch/g, 'q').replace(/ts/g, 'c').replace(/zh/g, 'j')
    .replace(/sh/g, 'x').replace(/ch/g, 'w').replace(/kh/g, 'h')
}

// ── Result type ───────────────────────────────────────────────────────────────

type ResultType = 'local' | 'street' | 'address' | 'place'

interface SearchResult {
  id: string
  name: string     // Display name (e.g. "улица Кожанова" or "улица Кожанова, 5")
  subname: string  // Secondary info (city, street, etc.)
  lat: number
  lng: number
  isLocal: boolean
  type: ResultType
}

// ── Photon geocoder ───────────────────────────────────────────────────────────
// Handles partial words ("больн" → "Больница"). No lang=ru — unsupported.

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    street?: string
    housenumber?: string
    city?: string
    osm_key?: string
    extent?: [number, number, number, number]
  }
}

async function searchPhoton(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.length < 2) return []
  try {
    const params = new URLSearchParams({ q: query, limit: '10', bbox: PHOTON_BBOX })
    const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
      headers: { 'User-Agent': 'Zholda/1.0' },
    })
    if (!res.ok) return []
    const json = await res.json() as { features: PhotonFeature[] }

    // ── Group street segments by name, compute centroid ──────────────────────
    // A street like "улица Кожанова" can have 3-5 highway segments in OSM.
    // We collapse them into ONE result and navigate to the average coordinate.
    const streetMap: Record<string, { originalName: string; lats: number[]; lngs: number[]; city: string }> = {}
    const addresses: SearchResult[] = []
    const places: SearchResult[] = []

    for (const f of json.features ?? []) {
      const p = f.properties
      const [lng, lat] = f.geometry.coordinates

      // Building with a house number → it's an address
      if (p.housenumber && (p.street || p.name)) {
        const street = p.street || p.name || ''
        addresses.push({
          id: `ph:${lng.toFixed(4)},${lat.toFixed(4)}`,
          name: `${street}, ${p.housenumber}`,
          subname: p.city || '',
          lat, lng,
          isLocal: false,
          type: 'address',
        })
        continue
      }

      // Highway/street segment → accumulate for centroid calculation
      if (p.osm_key === 'highway' && p.name) {
        const key = p.name.toLowerCase().trim()
        if (!streetMap[key]) streetMap[key] = { originalName: p.name, lats: [], lngs: [], city: p.city || '' }
        streetMap[key].lats.push(lat)
        streetMap[key].lngs.push(lng)
        continue
      }

      // Anything else with a name → generic place
      if (p.name) {
        places.push({
          id: `ph:${lng.toFixed(4)},${lat.toFixed(4)}`,
          name: p.name,
          subname: [p.street, p.city].filter(Boolean).slice(0, 1).join(', '),
          lat, lng,
          isLocal: false,
          type: 'place',
        })
      }
    }

    // Build one result per unique street, navigating to centroid
    const streets: SearchResult[] = Object.values(streetMap).map(group => {
      const avgLat = group.lats.reduce((s, v) => s + v, 0) / group.lats.length
      const avgLng = group.lngs.reduce((s, v) => s + v, 0) / group.lngs.length
      return {
        id: `ph:street:${group.originalName.toLowerCase().trim()}`,
        name: group.originalName,
        subname: group.city,
        lat: avgLat,
        lng: avgLng,
        isLocal: false,
        type: 'street' as ResultType,
      }
    })

    // Street first, then addresses, then places
    return [...streets, ...addresses, ...places]
  } catch {
    return []
  }
}

// ── Nominatim geocoder ────────────────────────────────────────────────────────
// Better for complete-word searches; strict bbox (bounded=1); addressdetails=1.

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  class?: string
  address?: {
    road?: string
    house_number?: string
    city?: string
    town?: string
    village?: string
  }
}

async function searchNominatim(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.length < 3) return []
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '6',
      'accept-language': 'ru,kk,en',
      viewbox: NOM_VIEWBOX,
      bounded: '1',
      addressdetails: '1',
    })
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { 'User-Agent': 'Zholda/1.0' } }
    )
    if (!res.ok) return []
    const data = await res.json() as NominatimResult[]

    const streetMap: Record<string, { originalName: string; lats: number[]; lngs: number[]; city: string }> = {}
    const addresses: SearchResult[] = []
    const places: SearchResult[] = []

    for (const r of data) {
      if (!r.display_name) continue
      const lat = parseFloat(r.lat)
      const lng = parseFloat(r.lon)
      const addr = r.address || {}
      const city = addr.city || addr.town || addr.village || ''

      if (addr.house_number && addr.road) {
        addresses.push({
          id: `nm:${lat.toFixed(4)},${lng.toFixed(4)}`,
          name: `${addr.road}, ${addr.house_number}`,
          subname: city,
          lat, lng,
          isLocal: false,
          type: 'address',
        })
        continue
      }

      if (r.class === 'highway') {
        const streetName = addr.road || r.display_name.split(', ')[0]
        const key = streetName.toLowerCase().trim()
        if (!streetMap[key]) streetMap[key] = { originalName: streetName, lats: [], lngs: [], city }
        streetMap[key].lats.push(lat)
        streetMap[key].lngs.push(lng)
        continue
      }

      const parts = r.display_name.split(', ')
      if (parts[0]) {
        places.push({
          id: `nm:${lat.toFixed(4)},${lng.toFixed(4)}`,
          name: parts[0],
          subname: parts.slice(1, 3).join(', '),
          lat, lng,
          isLocal: false,
          type: 'place',
        })
      }
    }

    const streets: SearchResult[] = Object.values(streetMap).map(group => ({
      id: `nm:street:${group.originalName.toLowerCase().trim()}`,
      name: group.originalName,
      subname: group.city,
      lat: group.lats.reduce((s, v) => s + v, 0) / group.lats.length,
      lng: group.lngs.reduce((s, v) => s + v, 0) / group.lngs.length,
      isLocal: false,
      type: 'street' as ResultType,
    }))

    return [...streets, ...addresses, ...places]
  } catch {
    return []
  }
}

// ── Route waypoint filter (instant; data from mockData ROUTE_WAYPOINTS) ─────

function filterWaypointMatches(query: string, waypointSubname: string): SearchResult[] {
  if (!query || query.length < 2) return []
  const normQ = normalizeForMatch(query)
  return ROUTE_WAYPOINTS
    .filter((w) => normalizeForMatch(w.name).includes(normQ))
    .map((w) => ({
      id: `waypoint:${w.id}`,
      name: w.name,
      subname: waypointSubname,
      lat: w.position.lat,
      lng: w.position.lng,
      isLocal: true,
      type: 'local' as ResultType,
    }))
}

// ── Merge + smart deduplicate ─────────────────────────────────────────────────
// Streets deduplicated by name (multiple segments = one result).
// Addresses and places deduplicated by coordinate (~100 m grid).
// Order: waypoint matches → street → address → place

function mergeAll(...sources: SearchResult[][]): SearchResult[] {
  const seenStreetName = new Set<string>()
  const seenCoord = new Set<string>()
  const locals: SearchResult[] = []
  const streets: SearchResult[] = []
  const addresses: SearchResult[] = []
  const places: SearchResult[] = []

  for (const batch of sources) {
    for (const r of batch) {
      if (!r.name.trim()) continue

      if (r.type === 'local') {
        const key = r.name.toLowerCase()
        if (!seenStreetName.has(key)) { seenStreetName.add(key); locals.push(r) }
      } else if (r.type === 'street') {
        const key = r.name.toLowerCase().trim()
        if (!seenStreetName.has(key)) { seenStreetName.add(key); streets.push(r) }
      } else {
        const key = `${r.lat.toFixed(3)},${r.lng.toFixed(3)}`
        if (!seenCoord.has(key)) {
          seenCoord.add(key)
          if (r.type === 'address') addresses.push(r)
          else places.push(r)
        }
      }
    }
  }

  return [...locals, ...streets, ...addresses, ...places].slice(0, 8)
}

// ── Yellow highlight on matching substrings ───────────────────────────────────

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>

  const tLow = text.toLowerCase()
  const qLow = query.toLowerCase()

  // Direct case-insensitive substring match
  const idx = tLow.indexOf(qLow)
  if (idx !== -1) {
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ color: '#FFD700', fontWeight: 700 }}>
          {text.slice(idx, idx + qLow.length)}
        </span>
        {text.slice(idx + qLow.length)}
      </>
    )
  }

  // Cross-script word match (e.g. "bolnica" → "Больница", "Джет" → "Jet")
  const queryWords = normalizeForMatch(qLow).split(/\s+/).filter(w => w.length >= 2)
  if (!queryWords.length) return <>{text}</>
  const tokens = text.split(/(\s+|,\s*|-\s*)/)
  let hit = false
  const nodes: React.ReactNode[] = tokens.map((tok, i) => {
    if (!tok.trim()) return tok
    if (queryWords.some(qw => normalizeForMatch(tok).startsWith(qw))) {
      hit = true
      return <span key={i} style={{ color: '#FFD700', fontWeight: 700 }}>{tok}</span>
    }
    return tok
  })
  return hit ? <>{nodes}</> : <>{text}</>
}

// ── Result row icon ───────────────────────────────────────────────────────────

function ResultIcon({ type, isLocal }: { type: ResultType; isLocal: boolean }) {
  if (isLocal) return <MapPin size={16} style={{ color: '#FFD700' }} className="flex-shrink-0 mt-0.5" />
  if (type === 'street')  return <Navigation size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
  if (type === 'address') return <Home size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
  return <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SearchBarProps {
  onMenuClick: () => void
  onLocationSelect: (lat: number, lng: number, name: string) => void
  /** Route ID to show in the walk-distance context pill after a search */
  recommendedRouteId?: string | null
  /** Distance in metres from the searched address to the nearest route point */
  searchWalkDistance?: number | null
  /** Whether the persistent GPS banner is showing (shifts the search bar down) */
  isGpsBannerVisible?: boolean
}

export default function SearchBar({
  onMenuClick,
  onLocationSelect,
  recommendedRouteId,
  searchWalkDistance,
  isGpsBannerVisible = false,
}: SearchBarProps) {
  const { t } = useLang()
  const { tk, isDark } = useTheme()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [waypointResults, setWaypointResults] = useState<SearchResult[]>([])
  const [apiResults, setApiResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Instant waypoint name match (no API)
  useEffect(() => {
    setWaypointResults(filterWaypointMatches(query, t('waypoints')))
  }, [query, t])

  // Debounced API search — Photon + Nominatim in parallel
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query || query.length < 2) {
      setApiResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    debounceRef.current = setTimeout(async () => {
      const promises: Promise<SearchResult[]>[] = [
        searchPhoton(query),
        searchNominatim(query),
      ]
      // For Latin input also search the Cyrillic version
      if (!hasCyrillic(query)) {
        const cyrVersion = latToCyr(query)
        if (cyrVersion !== query.toLowerCase()) {
          promises.push(searchPhoton(cyrVersion))
        }
      }
      const all = await Promise.all(promises)
      setApiResults(mergeAll(...all))
      setIsSearching(false)
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const allResults = mergeAll(waypointResults, apiResults)

  const handleSelect = (r: SearchResult) => {
    setQuery(r.name)
    setWaypointResults([])
    setApiResults([])
    setFocused(false)
    onLocationSelect(r.lat, r.lng, r.name)
  }

  const showDropdown = focused && query.length >= 1 && (
    isSearching || allResults.length > 0 || (query.length >= 2 && !isSearching)
  )

  return (
    <div
      className="absolute top-0 left-0 right-0 z-[1100] px-3 pb-2 pointer-events-none safe-top transition-all duration-300"
      style={{ 
        paddingTop: isGpsBannerVisible 
          ? 'calc(env(safe-area-inset-top, 0px) + 52px)' 
          : 'calc(env(safe-area-inset-top, 0px) + 16px)' 
      }}
    >
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onMenuClick}
          className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform"
          style={{
            background: tk.surfaceGlass,
            backdropFilter: tk.glassFilter,
            WebkitBackdropFilter: tk.glassFilter,
          }}
          aria-label={t('menu')}
        >
          <Menu size={20} style={{ color: tk.text }} />
        </button>

        <div className="relative flex-1">
          <div
            className="flex items-center gap-2 rounded-full shadow-lg px-4 h-11 transition-shadow"
            style={{
              background: tk.inputBg,
              backdropFilter: tk.glassFilter,
              WebkitBackdropFilter: tk.glassFilter,
              ...(focused ? { boxShadow: '0 0 0 2.5px #FFD700, 0 4px 16px rgba(0,0,0,0.12)' } : {}),
            }}
          >
            <Search size={18} className="flex-shrink-0" style={{ color: tk.textMuted }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 180)}
              placeholder={t('search_placeholder')}
              className="flex-1 bg-transparent outline-none font-medium"
              style={{
                color: tk.text,
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
              }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {isSearching && (
              <Loader size={16} className="animate-spin flex-shrink-0" style={{ color: tk.textMuted }} />
            )}
            {!isSearching && query && (
              <button
                onMouseDown={() => { setQuery(''); setWaypointResults([]); setApiResults([]) }}
                style={{ color: tk.textMuted }}
                className="hover:opacity-70 leading-none"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                zIndex: 1150,
                background: tk.surfaceGlass,
                backdropFilter: tk.glassFilter,
                WebkitBackdropFilter: tk.glassFilter,
                boxShadow: tk.shadow,
              }}
            >
              {isSearching && allResults.length === 0 && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm" style={{ color: tk.textMuted }}>
                  <Loader size={14} className="animate-spin flex-shrink-0" />
                  {t('search_searching')}
                </div>
              )}

              {!isSearching && allResults.length === 0 && query.length >= 2 && (
                <div className="px-4 py-3 text-sm" style={{ color: tk.textMuted }}>{t('search_no_results')}</div>
              )}

              {allResults.map((r) => (
                <button
                  key={r.id}
                  onMouseDown={() => handleSelect(r)}
                  className="w-full flex items-start gap-3 px-4 py-3 active:opacity-70 transition-colors text-left"
                  style={{
                    borderTop: `1px solid ${tk.divider}`,
                    background: 'transparent',
                  }}
                >
                  <ResultIcon type={r.type} isLocal={r.isLocal} />
                  <div className="min-w-0">
                    <p
                      className="text-sm leading-snug"
                      style={{ fontFamily: 'Inter, sans-serif', color: tk.text }}
                    >
                      <HighlightText text={r.name} query={query} />
                    </p>
                    {r.subname && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: tk.textMuted }}>
                        {r.subname}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Walk-distance context pill — shown after a location search resolves a route */}
      {searchWalkDistance != null && recommendedRouteId != null && !focused && (
        <div className="mt-1.5 pointer-events-none">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md"
            style={{
              background: isDark ? 'rgba(30,30,31,0.85)' : 'rgba(255,255,255,0.85)',
              backdropFilter: tk.glassFilter,
              WebkitBackdropFilter: tk.glassFilter,
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: '#16a34a', boxShadow: '0 0 5px rgba(22,163,74,0.6)' }}
            />
            <span
              className="text-xs font-semibold whitespace-nowrap"
              style={{ fontFamily: 'Inter, sans-serif', color: tk.text }}
            >
              {t('route')} {recommendedRouteId} — {t('recommended_nearest')} • {Math.round(searchWalkDistance)} {t('meter_abbr')} {t('walk_on_foot')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
