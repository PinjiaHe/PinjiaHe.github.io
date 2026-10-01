import type { z } from 'astro/zod';
import type { personSchema, publicationSchema } from './schemas';
type Person = z.infer<typeof personSchema>;
type Publication = z.infer<typeof publicationSchema>;
export const roleLabels: Record<string,string> = {phd:'PhD Students',masters:'MPhil Students',ra:'Research Assistants',undergraduate:'Undergraduates',postdoc:'Postdoctoral Researchers',visitor:'Visiting',other:'Researchers'};
export function memberGroup(role: string) {
  return ['mphil','msc','masters'].includes(role) ? 'masters' : role;
}
export function activeMembership(person: Person) {
  return person.memberships.find(m => m.status === 'active' && m.primary) ?? person.memberships.find(m => m.status === 'active');
}
export function lastMembership(person: Person) {
  return [...person.memberships].sort((a,b) => (b.end ?? '').localeCompare(a.end ?? ''))[0];
}
export function alumniMembershipEntries(people: Person[]) {
  return people.flatMap(person => person.memberships
    .filter(membership => membership.status === 'completed' && membership.alumniOrder !== undefined)
    .map(membership => ({person,membership})))
    .sort((a,b) => a.membership.alumniOrder! - b.membership.alumniOrder! || a.person.id.localeCompare(b.person.id) || a.membership.id.localeCompare(b.membership.id));
}
export function firstAuthorSummary(person: Person, publications: Publication[]) {
  return publicationSummaries(person,publications).filter(p=>p.firstAuthor).map(p=>p.label).join(' · ');
}
export function publicationSummaries(person: Person, publications: Publication[]) {
  if (person.publicationDisplay === 'legacy-summary') return [{label:person.legacyFirstAuthorSummary!,firstAuthor:true}];
  if (person.publicationDisplay === 'source-summary') return person.publicationSummary;
  return publications.filter(p => p.visibility === 'public').flatMap(p => {
    const author = p.authors.find(a => a.personId === person.id);
    if (!author) return [];
    const firstAuthor = author.contribution === 'first';
    if (person.publicationDisplay === 'linked-first-author' && !firstAuthor) return [];
    const track = p.track && !['research track','long papers'].includes(p.track.toLowerCase()) ? ` (${p.track})` : '';
    return [{label:`${p.venue}${String(p.year).slice(-2)}${track}`,firstAuthor,url:`/publications/#${p.id}`}];
  });
}
