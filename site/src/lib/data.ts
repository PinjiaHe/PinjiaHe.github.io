import { parse } from 'yaml';
import rawSite from '../data/site.yaml?raw';
import rawHome from '../data/homepage.yaml?raw';
import { siteSchema, homeSchema } from './schemas';
export const site = siteSchema.parse(parse(rawSite));
export const homepage = homeSchema.parse(parse(rawHome));
export const showDrafts = import.meta.env.DEV && import.meta.env.SHOW_DRAFTS === '1';
