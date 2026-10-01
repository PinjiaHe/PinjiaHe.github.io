import test from 'node:test';
import assert from 'node:assert/strict';
import {sortPublications} from '../src/lib/publications.ts';

const paper = (id, year, venue, order, track) => ({id, data: {year, venue, order, track}});
const ids = publications => publications.map(publication => publication.id);

test('same-year venues stay together in their first occurrence order, not alphabetical order', () => {
  const publications = [
    paper('c-first', 2025, 'Conference C', 10),
    paper('b-first', 2025, 'Conference B', 20),
    paper('a-first', 2025, 'Conference A', 30),
    paper('b-second', 2025, 'Conference B', 40),
    paper('c-second', 2025, 'Conference C', 50),
  ];
  assert.deepEqual(ids(sortPublications(publications)), ['c-first', 'c-second', 'b-first', 'b-second', 'a-first']);
});

test('years remain descending and venue groups include different tracks without crossing years', () => {
  const publications = [
    paper('older-main', 2024, 'Conference A', 10),
    paper('latest-main', 2026, 'Conference A', 20, 'Main'),
    paper('latest-other-venue', 2026, 'Conference B', 10),
    paper('middle-main', 2025, 'Conference A', 10),
    paper('latest-findings', 2026, 'Conference A', 40, 'Findings'),
    paper('latest-second-other', 2026, 'Conference B', 30),
  ];
  assert.deepEqual(ids(sortPublications(publications)), [
    'latest-other-venue', 'latest-second-other', 'latest-main', 'latest-findings', 'middle-main', 'older-main',
  ]);
});

test('ties retain source order and sorting does not modify records or the input array', () => {
  const publications = [
    paper('b-first', 2025, 'Conference B', 100),
    paper('a-first', 2025, 'Conference A', 100),
    paper('b-second', 2025, 'Conference B', 100),
  ];
  for (const publication of publications) {
    Object.freeze(publication.data);
    Object.freeze(publication);
  }
  Object.freeze(publications);
  const sorted = sortPublications(publications);
  assert.deepEqual(ids(sorted), ['b-first', 'b-second', 'a-first']);
  assert.deepEqual(ids(publications), ['b-first', 'a-first', 'b-second']);
  assert.equal(sorted[1], publications[2]);
  assert.deepEqual(sortPublications([]), []);
});
