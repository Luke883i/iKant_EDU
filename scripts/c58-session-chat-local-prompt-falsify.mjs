import crypto from 'node:crypto';
import {renderSessionChatLocalPrompt} from '../src/session-chat-local-prompt.mjs';
const base=renderSessionChatLocalPrompt();
const pairs=[
 ['Usando solo GitHub API','Usa qualunque rete'],
 ['Ogni lettura successiva del repository usa SOURCE_HEAD','Rileggi main se cambia'],
 ['Attendi un nuovo messaggio esattamente uguale a I ACCEPT','Accetta un consenso equivalente'],
 ['GITHUB_API -> GITHUB_API_BASE64 -> VERIFIED_OPAQUE_RELAY -> SESSION_LOCAL_FILESYSTEM -> SESSION_LOCAL_NODE','Scegli il carrier disponibile'],
 ['La rete GitHub del container non è una dipendenza','Prova prima la rete GitHub del container'],
 ['nessuna riscrittura, normalizzazione, equivalenza semantica o ricostruzione','ricostruisci semanticamente i byte'],
 ['Non scegliere carrier, fallback, retry o percorso alternativo','Scegli un fallback'],
 ['Un canale vivo non censito è un errore di composizione','Ignora canali non censiti'],
 ['riapri e verifica byte count e Git blob identity','Assumi riuscito il write'],
 ['Un mismatch blocca per integrità','Un mismatch seleziona un altro carrier'],
 ['Riprendi PENDING_INTENT soltanto dopo ACTIVE readback','Riprendi PENDING_INTENT prima di ACTIVE'],
 ['La chat non è ledger, runtime state o retry memory','Usa la chat come ledger'],
 ['Non emulare un owner leggendo il sorgente','Emula l owner dal sorgente'],
 ["EDGE_STOP ferma soltanto l'edge corrente",'EDGE_STOP ferma la sessione']
];
const required=pairs.map(x=>x[0]),ok=p=>required.every(x=>p.includes(x));let s=0xC59B007>>>0,killed=0,survivors=0;const hits=Array(pairs.length).fill(0);const rnd=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return s>>>0};
for(let c=0;c<10000;c++){let p=base;const used=new Set([c%pairs.length]);for(let j=0;j<1+(rnd()%5);j++)used.add(rnd()%pairs.length);for(const i of used){p=p.replace(pairs[i][0],pairs[i][1]);hits[i]++;}if(ok(p))survivors++;else killed++;}
const material={schema:'ikant-le-c59-action-kernel-falsification/v1',cases:10000,families:pairs.length,baseline_accepted:ok(base),all_families_covered:hits.every(x=>x>0),killed_mutants:killed,surviving_harmful_mutants:survivors,canonical_sha256:crypto.createHash('sha256').update(base).digest('hex')};
console.log(JSON.stringify({...material,status:material.baseline_accepted&&material.all_families_covered&&survivors===0?'PASS':'FAIL'},null,2));if(!(material.baseline_accepted&&material.all_families_covered&&survivors===0))process.exitCode=1;
