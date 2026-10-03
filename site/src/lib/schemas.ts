import { z } from 'astro/zod';
const text = z.string().trim().min(1);
export const stableId = text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const url = z.url().refine((s) => /^https?:\/\//.test(s), 'Use an http(s) URL');
export const partialDate = text.refine((s) => {
  if (!/^\d{4}(-\d{2})?(-\d{2})?$/.test(s)) return false;
  const full = s.length === 4 ? `${s}-01-01` : s.length === 7 ? `${s}-01` : s;
  const d = new Date(`${full}T00:00:00Z`);
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === full;
}, 'Use a valid YYYY, YYYY-MM, or YYYY-MM-DD date');
const common = { id: stableId, visibility: z.enum(['public','draft']).default('draft'), sources: z.array(text).default([]), sourceSnapshotDate: partialDate.optional(), order: z.number().default(100) };
const links = z.record(text, url).default({});
const award = z.object({ type: text, label: text, source: url.optional() });
const publicationSummaryItem = z.object({label:text, firstAuthor:z.boolean().default(false), url:url.optional()});
const citationSnapshot = z.object({
  sourceUrl: url.refine(s => new URL(s).hostname === 'scholar.google.com', 'Use the Google Scholar source'),
  count: z.number().int().nonnegative().optional(), retrievedAt: partialDate.optional(), estimated: z.boolean().default(false)
}).refine(m => m.count === undefined || !!m.retrievedAt, {message:'A citation count needs its retrieval date', path:['retrievedAt']});
const githubStarSnapshot = z.object({
  sourceUrl: url.refine(s => new URL(s).hostname === 'github.com', 'Use the GitHub repository source'),
  count: z.number().int().nonnegative(), retrievedAt: partialDate
});
const membership = z.object({
  id: stableId, role: z.enum(['phd','mphil','msc','masters','ra','undergraduate','postdoc','visitor','other']), label: text.optional(),
  status: z.enum(['active','completed','unknown']), primary: z.boolean().optional(), start: partialDate.optional(), end: partialDate.optional(), supervisors: z.array(text).optional(),
  alumniOrder: z.number().int().nonnegative().optional(),
  nextStep: z.object({kind: z.enum(['further-study','industry','academia','other']), status: z.enum(['joined','offer','reported','unknown']), label: text, institution: text.optional(), role: text.optional(), asOf: partialDate.optional(), source: url.optional()}).optional()
}).refine((m) => !m.start || !m.end || m.end >= m.start, { message: 'End must not precede start', path: ['end'] })
.refine((m) => m.alumniOrder === undefined || m.status === 'completed', {message: 'An alumni entry must use a completed membership', path: ['alumniOrder']});
export const personSchema = z.object({
  ...common, name: text, website: url.optional(), photo: text.optional(), photoAlt: text.optional(), memberships: z.array(membership).min(1),
  currentPosition: z.object({label: text, asOf: partialDate}).optional(),
  education: z.array(z.object({institution: text, degree: text.optional(), program: text.optional(), period: text.optional(), details: z.array(text).default([]), publicationSummary: z.array(publicationSummaryItem).default([]), rank: z.object({display: text, scope: text, asOf: partialDate.optional(), source: text.optional()}).optional()})).default([]),
  publicationDisplay: z.enum(['linked-first-author','linked','legacy-summary','source-summary']), legacyFirstAuthorSummary: text.optional(),
  publicationSummary: z.array(publicationSummaryItem).default([]),
  entryStyle: z.enum(['full','compact']).default('full'), previously:z.union([text,z.literal(false)]).optional(), notes:z.array(text).default([]),
  awards: z.array(text).default([]), visits: z.array(text).default([])
}).refine((p) => p.publicationDisplay !== 'legacy-summary' || !!p.legacyFirstAuthorSummary, {message: 'Legacy mode needs its source summary', path: ['legacyFirstAuthorSummary']})
.refine((p) => p.publicationDisplay !== 'source-summary' || p.publicationSummary.length > 0, {message: 'Source-summary mode needs a verified publication summary', path: ['publicationSummary']})
.refine((p) => p.memberships.filter(m => m.status === 'active').length <= 1 || p.memberships.filter(m => m.status === 'active' && m.primary).length === 1, {message: 'Multiple active memberships need exactly one primary', path: ['memberships']});
export const publicationSchema = z.object({
  ...common, title: text, year: z.number().int().min(1900).max(2100), venue: text, track: text.optional(), publicationStatus: z.enum(['published','accepted','preprint']).default('published'),
  authors: z.array(z.object({name: text, authorId: stableId.optional(), personId: stableId.optional(), contribution: z.enum(['first','co-first','other','unknown']).default('unknown'), supervised: z.boolean().default(false)})).min(1),
  awards: z.array(award).default([]), citations: citationSnapshot.optional(), links
});
export const projectSchema = z.object({
  ...common, slug: stableId, title: text, summary: text, problem: text.optional(), contribution: text.optional(), themes: z.array(text).min(1), publicationIds: z.array(stableId).min(1),
  evidence: z.array(z.object({label:text, kind:z.literal('industry-use').optional(), text:text.optional(), value:text.optional(), scope:text.optional(), sourceUrl:url, asOf:partialDate.optional(), organizations:z.array(z.object({name:text, logo:z.enum(['anthropic','microsoft']).optional(), sourceUrl:url})).optional()})).default([]), githubStars: githubStarSnapshot.optional(), links,
  cover: text.optional(), coverAlt: text.optional(), coverCaption: text.optional(), coverSourceUrl: url.optional(), coverLinkText: text.optional()
}).refine(p => !p.cover || !!(p.coverAlt && p.coverCaption), {message:'A project image needs alt text and a caption', path:['cover']})
.refine(p => !p.coverLinkText || !!(p.coverSourceUrl && p.coverCaption?.includes(p.coverLinkText)), {message:'Caption link text must appear in the caption and have a source URL', path:['coverLinkText']});
export const noteSchema = z.object({...common, slug: stableId, title: text, summary: text, author: text, lang: z.enum(['en','zh-CN']), date: partialDate, tags: z.array(text).default([])});
export const resourceSchema = z.object({...common, title: text, author: text, url, lang: z.enum(['en','zh-CN']), tags: z.array(text).default([]), recommendation: text.optional()});
export const pageSchema = z.object({
  ...common, title: text, description: text, eyebrow: text.optional(), positioning: text.optional(), statement: text.optional(),
  researchButton: text.optional(), labButton: text.optional(),
  pillars: z.array(z.object({id:stableId, title:text, description:text})).default([]),
  mission: text.optional(), joinTitle:text.optional(), joinText:text.optional(), contactText:text.optional(), labSummary:text.optional(), undergraduateNote:text.optional()
});
// Chinese prose overlays cannot replace the original facts, URLs, IDs or metrics.
export const translationSchema = z.object({
  id: stableId, visibility: z.literal('public'),
  text: z.object({
    title: text.optional(), description: text.optional(), eyebrow: text.optional(), positioning: text.optional(), statement: text.optional(),
    researchButton: text.optional(), labButton: text.optional(), mission: text.optional(), joinTitle: text.optional(), joinText: text.optional(),
    contactText: text.optional(), labSummary: text.optional(), undergraduateNote: text.optional(),
    pillars: z.array(z.object({title:text, description:text}).strict()).optional(),
    summary: text.optional(), problem: text.optional(), contribution: text.optional(),
    coverAlt: text.optional(), coverCaption: text.optional(), coverLinkText: text.optional(),
    evidence: z.array(z.object({label:text, text:text.optional(), scope:text.optional()}).strict()).optional()
  }).strict()
}).strict();
export const siteSchema = z.object({name:text, personId:stableId, role:text, affiliation:text, distinction:text.optional(), secondaryRole:text, email:z.email(), defaultLanguage:text, photo:text, photoAlt:text, photoWidth:z.number(), photoHeight:z.number(), links, legacyLinks:links, contactText:text});
export const homeSchema = z.object({featuredProjectIds:z.array(stableId), featuredNoteIds:z.array(stableId), featuredResourceIds:z.array(stableId), showMetrics:z.boolean(), showLabPhoto:z.boolean()});
export const schemas = {people:personSchema, publications:publicationSchema, projects:projectSchema, notes:noteSchema, resources:resourceSchema, pages:pageSchema, translations:translationSchema};
