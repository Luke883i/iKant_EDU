import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../src/contract.mjs';

const text=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const json=p=>JSON.parse(text(p));

test('C59 orientation capsule presents one canonical SESSION_CHAT_LOCAL composition',()=>{
 const readme=text('README.md'),agents=text('AGENTS.md'),terms=text('TERMS.md'),boot=json('BOOTSTRAP.json');
 assert.match(readme,/one canonical `SESSION_CHAT_LOCAL` composition/);
 assert.match(agents,/follow exactly one composition/);
 // EDU Terms no longer select or delegate to the separate legacy local/MCP composition.
 assert.match(terms,/MCP is an independent externally installed app\/service surface/);
 assert.match(terms,/No MCP plugin, widget or service is a prerequisite for EDU/);
 assert.doesNotMatch(terms,/CANONICAL/);
 assert.doesNotMatch(terms,/A carrier may be API\/base64/);
 assert.equal(boot.session_chat_composition.canonical,true);
 assert.equal(boot.session_chat_composition.canonical_authority,'C59_CANONICAL');
 assert.equal(boot.session_chat_composition.legacy_active_is_canonical,false);
 assert.equal(boot.for_ai_agent_first_entrypoint.ai_cycle.canonical_session_chat_role,'LEGACY_COMPATIBILITY_ONLY');
 assert.equal(boot.for_ai_agent_first_entrypoint.bootstrap_type_registry_cache.canonical_session_chat_authority,false);
 assert.equal(boot.for_ai_agent_first_entrypoint.distribution_boundary.canonical_session_chat_authority,false);
});

test('C59 reference app is explicitly legacy deployed compatibility, never canonical local activation',()=>{
 const plugin=text('plugins/ikant-le-session-chat/server/server.mjs');
 const census=json('contracts/session-chat-composition-census.json');
 assert.doesNotMatch(plugin,/Canonical model-visible iKant_LE open binding|App-only canonical ACTIVE turn|Canonical deployed iKant_LE session surface/);
 assert.match(plugin,/Legacy deployed compatibility open binding/);
 const app=census.channels.find(x=>x.id==='APP_BOUND_IKANT_LE_OPEN');
 assert.equal(app.status,'EXCLUDED_LEGACY_PROFILE');
 const deployed=census.channels.find(x=>x.id==='plugins/ikant-le-session-chat');
 assert.equal(deployed.status,'EXCLUDED_NONCANONICAL');
});
