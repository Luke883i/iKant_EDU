import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectC74PostmergeSource,validateC74SourceAudit} from '../host/c74-postmerge-source-audit.mjs';
test('C74 postmerge C73 assets, 70 Cx anchors and 36 ontological atoms are present but not ACTIVE evidence',()=>{
 const s=inspectC74PostmergeSource();
 assert.equal(s.status,'SOURCE_CATALOGUE_COMPLETE');
 assert.equal(s.required_c73_file_count,8);
 assert.equal(s.required_c73_files_present,8);
 assert.equal(s.ontological_atom_count,36);
 assert.equal(s.domain_count,9);
 assert.equal(s.cx_source_count,70);
 assert.equal(s.cx_source_anchor_count,70);
 assert.equal(s.ontology_respect_proven,false);
 assert.equal(s.ontological_score_claimed,null);
 assert.equal(s.native_host_ingress_verified,false);
 assert.equal(s.host_delivery_verified,false);
 assert.equal(s.user_value_95_percent_proven,false);
 assert.equal(validateC74SourceAudit(s),true);
});
test('C74 360 ledger/ontology mutation probes cannot become evidence of owner state',()=>{
 let rejected=0;
 const base=inspectC74PostmergeSource();
 for(let i=0;i<360;i++){
  const s=structuredClone(base);
  const n=i%36,g=Math.floor(i/36);
  if(g===0)s.ontology_atoms[n].runtime_execution_attested_by_this_catalogue=true;
  else if(g===1)s.ontology_atoms[n].actual_host_origin_attested=true;
  else if(g===2)s.ontology_atoms[n].current_host_native_persistence_attested=true;
  else if(g===3)s.ontology_atoms[n].source_contract_present=false;
  else if(g===4)s.ontology_atoms[n].weight_bps=10000;
  else if(g===5)s.ontology_atoms[n].id='FAKE_CX_'+n;
  else if(g===6)s.native_host_ingress_verified=true;
  else if(g===7)s.user_value_95_percent_proven=true;
  else if(g===8)s.ontology_respect_proven=true;
  else s.safety.new_owner_count=1;
  assert.equal(validateC74SourceAudit(s),false,String(i));
  rejected++;
 }
 assert.equal(rejected,360);
});
