import {getEntry, type CollectionEntry} from 'astro:content';
import type {Locale} from './locale';

export async function localizedPage(id: string, locale: Locale) {
  const original = (await getEntry('pages', id))!;
  if (locale === 'en') return {entry:original, content:original};
  const translation = (await getEntry('translations', id))!;
  const {pillars, evidence: _evidence, ...copy} = translation.data.text;
  const entry = {...original, data:{...original.data, ...copy,
    pillars:original.data.pillars.map((pillar, index) => ({...pillar, ...pillars?.[index]}))}};
  return {entry, content:translation};
}

export async function localizedProject(original: CollectionEntry<'projects'>, locale: Locale) {
  if (locale === 'en') return {entry:original, content:original};
  const translation = (await getEntry('translations', original.id))!;
  const {evidence, pillars: _pillars, ...copy} = translation.data.text;
  const entry = {...original, data:{...original.data, ...copy,
    evidence:original.data.evidence.map((item, index) => ({...item, ...evidence?.[index]}))}};
  return {entry, content:translation};
}
