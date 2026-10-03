import {parse} from 'yaml';
import uiSource from '../data/zh/ui.yaml?raw';
import memberSource from '../data/zh/people.yaml?raw';
import type {Locale} from './locale';
export {localeFromPath, localizeHref, languageSwitchHref, englishPath} from './locale';
const ui = parse(uiSource) as Record<string,string>;
const members = parse(memberSource) as Record<string,string>;
export const translator = (locale: Locale) => (text: string) => locale === 'zh' ? (ui[text] ?? text) : text;
export const memberText = (text: string | undefined, locale: Locale) => text === undefined ? '' : locale === 'zh' ? (members[text] ?? text) : text;
