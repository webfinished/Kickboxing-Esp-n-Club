import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY?.trim();
let PLACE_ID = process.env.GOOGLE_PLACE_ID?.trim();
const REVIEWS_FILE = resolve('data/reviews.json');

if (!API_KEY) {
  console.log('GOOGLE_PLACES_API_KEY no configurada. Se mantiene data/reviews.json actual.');
  process.exit(0);
}

async function resolvePlaceId() {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({
      textQuery: 'Kickboxing Espin Av. de Valencia 33 Molina de Segura Murcia',
      languageCode: 'es',
    }),
  });

  if (!res.ok) {
    throw new Error(`Error buscando Place ID (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  const place = data.places?.[0];
  if (!place?.id) {
    throw new Error('No se encontró el Place ID de Kickboxing Espín.');
  }
  console.log(`Place ID detectado: ${place.id} (${place.displayName?.text})`);
  return place.id;
}

async function fetchPlaceReviews(placeId) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
    },
  });

  if (!res.ok) {
    throw new Error(`Error leyendo reseñas (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

function normalizeReviews(rawReviews = [], existingReviews = []) {
  const map = new Map();

  for (const r of existingReviews) {
    const key = `${r.author.toLowerCase()}::${r.text.slice(0, 40).toLowerCase()}`;
    map.set(key, r);
  }

  for (const item of rawReviews) {
    const text = (item.text?.text || item.originalText?.text || '').trim();
    if (!text) continue;
    const author = (item.authorAttribution?.displayName || 'Alumno del club').trim();
    const rating = Number(item.rating) || 5;
    const key = `${author.toLowerCase()}::${text.slice(0, 40).toLowerCase()}`;
    map.set(key, { author, rating, text });
  }

  // Ordenar siempre de la reseña más completa a la más breve
  return Array.from(map.values()).sort((a, b) => b.text.length - a.text.length);
}

async function main() {
  if (!PLACE_ID) {
    PLACE_ID = await resolvePlaceId();
  }

  const existing = JSON.parse(readFileSync(REVIEWS_FILE, 'utf8'));
  const placeData = await fetchPlaceReviews(PLACE_ID);

  const rating = typeof placeData.rating === 'number' ? Number(placeData.rating.toFixed(1)) : existing.rating;
  const userRatingCount =
    typeof placeData.userRatingCount === 'number' ? placeData.userRatingCount : existing.userRatingCount;
  const reviews = normalizeReviews(placeData.reviews, existing.reviews);

  const next = {
    rating,
    userRatingCount,
    updatedAt: new Date().toISOString(),
    reviews,
  };

  const prevComparable = JSON.stringify({
    rating: existing.rating,
    userRatingCount: existing.userRatingCount,
    reviews: existing.reviews,
  });
  const nextComparable = JSON.stringify({
    rating: next.rating,
    userRatingCount: next.userRatingCount,
    reviews: next.reviews,
  });

  if (prevComparable === nextComparable) {
    console.log('Sin cambios en reseñas o puntuación.');
    return;
  }

  writeFileSync(REVIEWS_FILE, JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.log(`Actualizado data/reviews.json: ${rating}/5 (${reviews.length} reseñas).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
