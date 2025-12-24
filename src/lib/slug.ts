export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function makeEventSlug(title: string) {
  const base = slugify(title) || "event";
  // short random suffix to avoid collisions
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}
