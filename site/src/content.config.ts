import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { schemas } from './lib/schemas';
const content = (name: string) => glob({base: `./src/content/${name}`, pattern: '**/*.{md,yaml}', generateId: ({entry}) => entry.replace(/\.(md|yaml)$/, '')});
export const collections = {
  pages: defineCollection({loader:content('pages'),schema:schemas.pages}),
  people: defineCollection({loader:content('people'),schema:schemas.people}),
  publications: defineCollection({loader:content('publications'),schema:schemas.publications}),
  projects: defineCollection({loader:content('projects'),schema:schemas.projects}),
  resources: defineCollection({loader:content('resources'),schema:schemas.resources}),
  notes: defineCollection({loader:glob({base: '.', pattern: import.meta.env.DEV && import.meta.env.SHOW_DRAFTS === '1' ? '{src/content,tests/fixtures}/notes/*.md' : 'src/content/notes/*.md', generateId: ({entry}) => entry.split('/').pop()!.replace(/\.md$/, '')}),schema:schemas.notes})
};
