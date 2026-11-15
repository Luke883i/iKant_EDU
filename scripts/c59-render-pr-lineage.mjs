import fs from 'node:fs';
const L=JSON.parse(fs.readFileSync('contracts/bootstrap-channel-lineage.json','utf8'));
const lines=[
 '# C59 — PR1–68 bootstrap/channel lineage audit',
 '',
 'This document is generated from `contracts/bootstrap-channel-lineage.json`. It is descriptive evidence; canonical activation authority remains in the C59 composition contract.',
 '',
 '## Coverage',
 '',
 `- PRs covered: **${L.prs.length}** (#1–#68)`,
 `- merged: **${L.prs.filter(x=>x.state==='MERGED').length}**`,
 `- closed/unmerged attempts retained: **${L.prs.filter(x=>x.state==='CLOSED_UNMERGED').length}** (#24, #27, #34, #36, #42, #43)`,
 `- current open PR: **#68**`,
 `- registered historical channel atoms: **${L.registry.length}**`,
 '',
 '## Unitary audit',
 '',
 '| PR | State | Semantic value | Channel atoms |',
 '| ---: | --- | --- | --- |'
];
for(const p of L.prs){
 const atoms=(p.channel_atoms||[]).length?p.channel_atoms.map(x=>'`'+x+'`').join(', '):'—';
 lines.push(`| #${p.pr} | ${p.state} | ${p.semantic_value.replace(/\|/g,'/')} | ${atoms} |`);
}
lines.push('','## Terminal channel registry','','| Atom | Terminal classification | Normalizes to |','| --- | --- | --- |');
for(const r of L.registry)lines.push(`| \`${r.id}\` | ${r.class} | ${r.normalizes_to?'`'+r.normalizes_to+'`':'—'} |`);
lines.push('','## Closure law','','Every PR is represented exactly once. Every channel atom referenced by a PR must exist in the terminal registry. Every registry atom must be referenced by at least one PR. Current exported carriers and byte paths must also occur in the same registry. History is evidence only and cannot create runtime authority.','');
process.stdout.write(lines.join('\n'));
