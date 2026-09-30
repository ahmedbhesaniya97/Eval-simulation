// Deterministic helpers so mock data looks the same on every reload.

export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Stable 0..1 value for any string key.
export const chance = (key) => mulberry32(hash(key))()

export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)]
export const between = (rng, min, max) => min + rng() * (max - min)
export const intBetween = (rng, min, max) => Math.floor(between(rng, min, max + 1))

export function weightedPick(rng, items) {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = rng() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}
