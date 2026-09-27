'use client';

import { motion } from 'framer-motion';
import type { Plan } from '@/types';

const ZOOM = 16;
const TILE = 256;

// Slippy-map tile coordinates for a lat/lon, with the fractional part kept for centering.
function tileXY(lat: number, lon: number, z: number) {
  const n = 2 ** z;
  const x = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

function MiniMap({ lat, lon, name }: { lat: number; lon: number; name: string }) {
  const { x, y } = tileXY(lat, lon, ZOOM);
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  const fx = x - cx;
  const fy = y - cy;
  const offsets = [-1, 0, 1];

  return (
    <div className="relative h-36 w-full overflow-hidden bg-black" role="img" aria-label={`Map showing ${name}`}>
      <div
        className="absolute left-1/2 top-1/2"
        style={{ filter: 'invert(1) hue-rotate(180deg) brightness(0.75) contrast(1.15) saturate(0.35)' }}
      >
        {offsets.flatMap((dy) =>
          offsets.map((dx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${dx},${dy}`}
              src={`https://tile.openstreetmap.org/${ZOOM}/${cx + dx}/${cy + dy}.png`}
              alt=""
              width={TILE}
              height={TILE}
              loading="lazy"
              className="absolute max-w-none"
              style={{ left: (dx - fx) * TILE, top: (dy - fy) * TILE }}
            />
          ))
        )}
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 -m-3 rounded-full bg-[var(--accent)]/30 animate-ping" />
        <span className="block h-3 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)] ring-2 ring-black" />
      </div>
      <span className="absolute bottom-1 right-1.5 text-[9px] text-white/50">© OpenStreetMap</span>
    </div>
  );
}

export function PlanCard({ plan }: { plan: Plan }) {
  const { place } = plan;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} Atlanta`)}`;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="mt-3 overflow-hidden"
    >
      <div className="border border-[var(--accent)]/40 bg-black">
        <MiniMap lat={place.lat} lon={place.lon} name={place.name} />
        <div className="p-3">
          <p className="font-pixel text-[10px] tracking-wider uppercase text-[var(--accent)]">
            Plan · {place.distanceMi.toFixed(1)} mi from the venue
          </p>
          <p className="mt-1 text-[15px] leading-snug text-[var(--ink)]">{plan.line}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {place.name}
            {place.street ? ` · ${place.street}` : ''}
          </p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-outline mt-3 inline-block font-pixel text-[10px] tracking-wider px-3 py-1.5"
          >
            OPEN IN MAPS
          </a>
        </div>
      </div>
    </motion.div>
  );
}
