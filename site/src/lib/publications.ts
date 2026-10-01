type PublicationEntry = {data: {year: number; venue: string; order: number}};

export function sortPublications<T extends PublicationEntry>(publications: readonly T[]): T[] {
  const sorted = [...publications].sort((a, b) => b.data.year - a.data.year || a.data.order - b.data.order);
  const years = new Map<number, Map<string, T[]>>();
  for (const publication of sorted) {
    const {year, venue} = publication.data;
    if (!years.has(year)) years.set(year, new Map());
    const venues = years.get(year)!;
    if (!venues.has(venue)) venues.set(venue, []);
    venues.get(venue)!.push(publication);
  }
  // Map insertion order keeps each year's first venue occurrence and each venue's original order.
  return [...years.values()].flatMap(venues => [...venues.values()].flat());
}
