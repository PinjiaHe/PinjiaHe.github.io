import test from 'node:test';
import assert from 'node:assert/strict';
import { personSchema, publicationSchema, partialDate, projectSchema } from '../src/lib/schemas.ts';
import { activeMembership, alumniMembershipEntries, firstAuthorSummary, publicationSummaries, memberGroup, roleLabels } from '../src/lib/people.ts';

// Synthetic identities and rankings stay here, outside all production collections.
const person = overrides => personSchema.parse({
  id: 'test-researcher', name: 'Synthetic Researcher — TEST ONLY',
  memberships: [{ id: 'test-phd', role: 'phd', status: 'active' }],
  publicationDisplay: 'linked-first-author', ...overrides,
});
const paper = overrides => publicationSchema.parse({
  id: 'test-paper', title: 'Synthetic paper — TEST ONLY', year: 2025, venue: 'Test Conference', visibility: 'public',
  authors: [{ name: 'Synthetic Researcher — TEST ONLY', personId: 'test-researcher', supervised: true }], ...overrides,
});

test('missing optional rank, photo, and next step are valid; default visibility is draft', () => {
  const record = person({});
  assert.equal(record.visibility, 'draft');
  assert.equal(record.photo, undefined);
  assert.deepEqual(record.education, []);
  assert.equal(record.memberships[0].nextStep, undefined);
});

test('completed MPhil followed by active PhD remains one current person', () => {
  const record = person({ memberships: [
    { id: 'test-mphil', role: 'mphil', status: 'completed', start: '2022-09', end: '2024-07' },
    { id: 'test-phd', role: 'phd', status: 'active', start: '2024-09' },
  ] });
  assert.equal(activeMembership(record)?.role, 'phd');
  const current = [record].filter(item => activeMembership(item));
  const alumni = [record].filter(item => !activeMembership(item));
  assert.equal(new Set(current.map(item => item.id)).size, 1);
  assert.equal(alumni.length, 0);
});

test('approved alumni stages retain their own dates and next steps without duplicating people', () => {
  const continuing = person({ memberships: [
    { id: 'test-mphil', role: 'mphil', status: 'completed', start: '2022-09', end: '2024-07', alumniOrder: 20,
      nextStep: {kind:'further-study', status:'joined', label:'PhD, Synthetic University'} },
    { id: 'test-phd', role: 'phd', status: 'active', start: '2024-09' },
  ] });
  const departed = person({id:'test-departed', memberships:[
    {id:'test-masters', role:'masters', label:'MAIR', status:'completed', start:'2023-09', end:'2025-07', alumniOrder:10},
  ]});
  const unselected = person({id:'test-unselected', memberships:[
    {id:'test-other-mphil', role:'mphil', status:'completed', start:'2021-09', end:'2023-07'},
    {id:'test-other-phd', role:'phd', status:'active'},
  ]});
  const people = [continuing,unselected,departed];
  const entries = alumniMembershipEntries(people);
  assert.deepEqual(entries.map(entry=>entry.person.id),['test-departed','test-researcher']);
  assert.equal(entries[0].membership.label,'MAIR');
  assert.equal(entries[1].person,continuing);
  assert.deepEqual([entries[1].membership.start,entries[1].membership.end],['2022-09','2024-07']);
  assert.equal(entries[1].membership.nextStep.label,'PhD, Synthetic University');
  assert.equal(activeMembership(continuing).id,'test-phd');
  const current = people.filter(activeMembership);
  const departedPeople = people.filter(item=>!activeMembership(item));
  assert.equal(current.length,2);
  assert.equal(departedPeople.length,1);
  assert.equal(new Set([...current,...departedPeople].map(item=>item.id)).size,3);
  assert.deepEqual(people.map(item=>item.id),['test-researcher','test-unselected','test-departed']);
});

test('alumni ordering requires a completed membership and a nonnegative integer', () => {
  for (const status of ['active','unknown']) {
    assert.throws(()=>person({memberships:[{id:'test-stage',role:'mphil',status,alumniOrder:10}]}));
  }
  for (const alumniOrder of [-1,1.5]) {
    assert.throws(()=>person({memberships:[{id:'test-stage',role:'mphil',status:'completed',alumniOrder}]}));
  }
});

test('multiple active memberships require exactly one primary identity', () => {
  const memberships = [
    { id: 'test-phd', role: 'phd', status: 'active' },
    { id: 'test-visitor', role: 'visitor', status: 'active' },
  ];
  assert.throws(() => person({ memberships }));
  const record = person({ memberships: memberships.map((item, index) => ({ ...item, primary: index === 1 })) });
  assert.equal(activeMembership(record)?.id, 'test-visitor');
});

test('a historical rank requires a meaningful scope and nonempty display', () => {
  const education = rank => [{ institution: 'Synthetic University', rank }];
  assert.throws(() => person({ education: education({ display: 'Class rank: 3/120' }) }));
  assert.throws(() => person({ education: education({ display: ' ', scope: 'Synthetic cohort' }) }));
  const record = person({ education: education({ display: 'Class rank: 3/120', scope: 'Synthetic 2022 cohort', asOf: '2022-06', source: 'synthetic-test-fixture' }) });
  assert.equal(record.education[0].rank.scope, 'Synthetic 2022 cohort');
});

test('dates reject impossible dates and an end before its start', () => {
  for (const value of ['2025-02-29', '2024-13', '2024-00', '2024-04-31', 'yesterday']) assert.equal(partialDate.safeParse(value).success, false, value);
  for (const value of ['2024', '2024-02', '2024-02-29']) assert.equal(partialDate.safeParse(value).success, true, value);
  assert.throws(() => person({ memberships: [{ id: 'test-mphil', role: 'mphil', status: 'completed', start: '2024-09', end: '2023-07' }] }));
});

test('a supervision marker does not imply first authorship', () => {
  const publication = paper({});
  assert.equal(publication.authors[0].contribution, 'unknown');
  assert.equal(publication.authors[0].supervised, true);
  assert.equal(firstAuthorSummary(person({}), [publication]), '');
});

test('first-author summaries include only verified first contributions and exclude draft papers', () => {
  const publications = ['first', 'co-first', 'other'].map((contribution, index) => paper({ id: `test-paper-${index}`, authors: [{ name: 'Synthetic Researcher — TEST ONLY', personId: 'test-researcher', contribution }] }));
  publications.push(paper({ id: 'test-draft', visibility: 'draft', authors: [{ name: 'Synthetic Researcher — TEST ONLY', personId: 'test-researcher', contribution: 'first' }] }));
  const summary = firstAuthorSummary(person({}), publications);
  assert.equal(summary, 'Test Conference25');
  assert.deepEqual(publicationSummaries(person({}), publications).map(p => p.url), ['/publications/#test-paper-0']);
});

test('legacy source summaries preserve multiplicity and track labels without inferred matches', () => {
  const legacy = 'ExampleConf25 ×2 (Industry Track), ExampleConf26';
  const record = person({ publicationDisplay: 'legacy-summary', legacyFirstAuthorSummary: legacy });
  assert.equal(firstAuthorSummary(record, [paper({})]), legacy);
  assert.throws(() => person({ publicationDisplay: 'legacy-summary' }));
});

test('external links reject unsafe protocols', () => {
  assert.throws(() => person({ website: 'javascript:alert(1)' }));
  assert.throws(() => paper({ links: { pdf: 'data:text/html,unsafe' } }));
  assert.throws(() => paper({ links: { code: '' } }));
});

test('member publications include co-first and other collaborations but underline only first-author work', () => {
  const publications = ['first','co-first','other','unknown'].map((contribution,index) => paper({
    id:`test-collaboration-${index}`, authors:[{name:'Synthetic Researcher — TEST ONLY',personId:'test-researcher',contribution,supervised:true}],
  }));
  publications.push(paper({id:'test-hidden',visibility:'draft'}));
  publications.push(paper({id:'test-unrelated',authors:[{name:'Another Synthetic Researcher'}]}));
  const summaries = publicationSummaries(person({publicationDisplay:'linked'}),publications);
  assert.equal(summaries.length,4);
  assert.deepEqual(summaries.map(p=>p.firstAuthor),[true,false,false,false]);
  assert.ok(summaries.every(p=>p.url.startsWith('/publications/#test-collaboration-')));
});

test('source summaries preserve coauthored entries and do not duplicate linked records', () => {
  const record = person({publicationDisplay:'source-summary',publicationSummary:[
    {label:'TestConf 2025',firstAuthor:true,url:'https://example.org/paper.pdf'},
    {label:'TestConf 2026'},
  ]});
  assert.deepEqual(publicationSummaries(record,[paper({})]),[
    {label:'TestConf 2025',firstAuthor:true,url:'https://example.org/paper.pdf'},
    {label:'TestConf 2026',firstAuthor:false},
  ]);
  assert.throws(()=>person({publicationDisplay:'source-summary'}));
  assert.throws(()=>person({publicationDisplay:'source-summary',publicationSummary:[{label:'TestConf',url:'javascript:alert(1)'}]}));
});

test('MPhil group label keeps compatible masters role grouping and undated interns remain inactive', () => {
  assert.deepEqual(['mphil','msc','masters'].map(memberGroup),['masters','masters','masters']);
  assert.equal(roleLabels[memberGroup('mphil')], 'MPhil Students');
  assert.equal(memberGroup('phd'), 'phd');
  const intern=person({memberships:[{id:'test-intern',role:'undergraduate',status:'unknown'}]});
  assert.equal(activeMembership(intern),undefined);
  assert.equal(intern.memberships[0].start,undefined);
});

test('citation snapshots preserve an unknown count and require a dated Google Scholar source for numbers', () => {
  const sourceUrl='https://scholar.google.com/scholar?cites=123';
  assert.equal(paper({citations:{sourceUrl}}).citations.count,undefined);
  assert.equal(paper({citations:{sourceUrl,count:0,retrievedAt:'2026-09-28'}}).citations.count,0);
  assert.equal(paper({citations:{sourceUrl,count:10,retrievedAt:'2026-09-28',estimated:true}}).citations.estimated,true);
  assert.throws(()=>paper({citations:{sourceUrl,count:50}}));
  assert.throws(()=>paper({citations:{sourceUrl,count:-1,retrievedAt:'2026-09-28'}}));
  assert.throws(()=>paper({citations:{sourceUrl:'https://www.semanticscholar.org/paper/test',count:50,retrievedAt:'2026-09-28'}}));
});

test('repository stars need a GitHub source and a retrieval date', () => {
  const project={id:'test-project',slug:'test-project',title:'Synthetic project — TEST ONLY',summary:'Test only',themes:['test'],publicationIds:['test-paper']};
  const sourceUrl='https://github.com/example/test';
  assert.equal(projectSchema.parse({...project,githubStars:{sourceUrl,count:0,retrievedAt:'2026-09-28'}}).githubStars.count,0);
  assert.throws(()=>projectSchema.parse({...project,githubStars:{sourceUrl,count:5}}));
  assert.throws(()=>projectSchema.parse({...project,githubStars:{sourceUrl:'https://example.com',count:5,retrievedAt:'2026-09-28'}}));
});
