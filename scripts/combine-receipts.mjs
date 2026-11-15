import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { ROOT } from '../src/contract.mjs';

const [mainRel='artifacts/qualification/main-10m.json', tailRel='artifacts/qualification/tail-1m.json', outRel='artifacts/qualification/seed-v1.json'] = process.argv.slice(2);
const read = rel => JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const main = read(mainRel), tail = read(tailRel);
if (main.main_cases !== 10_000_000 || main.tail_cases !== 0 || main.status !== 'PASS' || main.survivor_count !== 0) throw new Error('main receipt invalid');
if (tail.main_cases !== 0 || tail.tail_cases !== 1_000_000 || tail.status !== 'PASS' || tail.tail_survivor_count !== 0) throw new Error('tail receipt invalid');
if (main.source_binding.digest !== tail.source_binding.digest) throw new Error('source binding mismatch');
const c=main.categories;
if (c.ordinary < 5_000_000 || c.edge < 3_000_000 || c.stress < 2_000_000) throw new Error('main category stratification invalid');
const material={
  schema:'ikant-le-qualification-summary/v1',
  status:'PASS',
  main:{cases:main.main_cases,survivors:main.survivor_count,receipt_sha256:main.receipt_sha256,categories:main.categories,wilson95_survivor_probability_upper_bound:main.wilson95_survivor_probability_upper_bound},
  no_novelty_tail:{cases:tail.tail_cases,survivors:tail.tail_survivor_count,receipt_sha256:tail.receipt_sha256},
  total_cases:main.main_cases+tail.tail_cases,
  source_binding:main.source_binding,
  abstractions:main.abstractions,
  exact_small_state_enumeration:main.exact_small_state_enumeration,
  physical_smoke:main.physical_smoke,
  claim_boundary:main.claim_boundary
};
const out={...material,receipt_sha256:crypto.createHash('sha256').update(JSON.stringify(material)).digest('hex')};
const target=path.join(ROOT,outRel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(out,null,2)+'\n');
process.stdout.write(JSON.stringify({status:out.status,total_cases:out.total_cases,receipt_sha256:out.receipt_sha256})+'\n');
