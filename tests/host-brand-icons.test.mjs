import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {verifyIkantBrandCheckout,validateIkantBrandBytes} from '../host/ikant-brand-integrity.mjs';
const root=resolve(new URL('../',import.meta.url).pathname);
const get=p=>readFileSync(resolve(root,p),'utf8');
const sample=()=>({manifest:get('plugins/ikant-le-session-chat/plugin.json'),light:get('assets/brand/ikant-light.svg'),dark:get('assets/brand/ikant-dark.svg'),pluginLight:get('plugins/ikant-le-session-chat/assets/ikant-light.svg'),pluginDark:get('plugins/ikant-le-session-chat/assets/ikant-dark-square.svg'),html:get('plugins/ikant-le-session-chat/server/public/ikant-le-app.html'),contract:JSON.parse(get('contracts/host-ikant-brand-projection-v1.json'))});
const cases=[
x=>{x.contract.source_head='f'.repeat(40);},
x=>{x.contract.provider_native_icon_attested=true;},
x=>{x.manifest=x.manifest.replace('"composerIcon"','"other"');},
x=>{x.manifest=x.manifest.replace('./assets/ikant-light.svg','../evil.svg');},
x=>{x.pluginLight=x.pluginLight.replace('#171717','#ffffff');},
x=>{x.pluginDark=x.pluginDark.replace('0 0 326 326','0 0 326 314');},
x=>{x.pluginDark=x.pluginDark.replace('</svg>','<script>alert(1)</script></svg>');},
x=>{x.pluginLight=x.pluginLight.replace('1024 1024','1024 960');},
x=>{x.html=x.html.replace('ikant-owned-brand','other-brand');},
x=>{x.html=x.html.replace('M469,50','M470,50');},
x=>{x.html=x.html.replace('<header class="ikant-brand-header">','<header class="ikant-brand-header hidden">');},
x=>{x.html=x.html.replace('</style>','#ikant-owned-brand{display:none}</style>');},
x=>{x.html=x.html.replace('<section data-slot="A"','<section data-slot="B"');},
x=>{x.html=x.html.replace('>NO_VOICE</div>','>FORGED_VOICE</div>');},
];
test('source brand asset integrity and six slots',()=>{const a=verifyIkantBrandCheckout(root);assert.equal(a.ok,true,JSON.stringify(a));assert.equal(a.native_chatgpt_icon_attested,false);});
test('all 14 mutation families denied',()=>{for(const f of cases){const x=sample();f(x);assert.equal(validateIkantBrandBytes(x).ok,false);}});
test('700 deterministic negative cases are not real ChatGPT observations',()=>{for(let i=0;i<700;i++){const x=sample();cases[i%cases.length](x);assert.equal(validateIkantBrandBytes(x).ok,false,String(i));}});
