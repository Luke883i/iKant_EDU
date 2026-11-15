#!/usr/bin/env python3
"""Exact Git commit -> reproducible Project prompt + ZIP, not a plugin installer.
Uses only Python stdlib and a clean Git checkout. Caller independently confirms LIVE main SHA.
"""
import argparse,hashlib,json,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
DOCS=tuple(f'{i:02d}_{n}.md' for i,n in enumerate(('README','PHASES','PROOFS','SLIDES','FILLER','ANNEX','PLUGIN','ROADMAP','RELEASE_BOUNDARY','ADAPTER_RECIPES','MVP_DO_D')))
ORIENT=('README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md')
PLUGIN=('README.md','plugin.json','mcp.template.json','server/package.json','server/public/ikant-le-app.html','server/server.mjs','server/transport-security.mjs','server/gateway-identity.mjs')
sha256=lambda b:hashlib.sha256(b).hexdigest()
def gitblob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def git(*args):return subprocess.check_output(['git','-c',f'safe.directory={ROOT}','-C',str(ROOT),*args],text=True).strip()
def meta(raw):return {'bytes':len(raw),'sha256':sha256(raw),'git_blob_sha1':gitblob(raw)}
def zipwrite(z,k,raw):
 info=zipfile.ZipInfo(k,(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,raw)
def build(out,expected_commit,expected_tree):
 head=git('rev-parse','HEAD');tree=git('rev-parse','HEAD^{tree}')
 if head!=expected_commit or tree!=expected_tree:raise ValueError('SOURCE_LOCK_STALE')
 if git('status','--porcelain'):raise ValueError('DIRTY_SOURCE_NOT_RELEASEABLE')
 members={}
 def add(name,source):
  b=(ROOT/source).read_bytes()
  if gitblob(b)!=git('rev-parse','HEAD:'+source):raise ValueError('SOURCE_BLOB_DRIFT:'+source)
  members[name]=b
 for d in DOCS:add('slides/'+d,'project/oneshell-v7/'+d)
 for name in ORIENT:add('orientation/'+name,name)
 for name in PLUGIN:add('plugin_source/plugins/ikant-le-session-chat/'+name,'plugins/ikant-le-session-chat/'+name)
 add('adapter_source/host/p1-semantic-annex.mjs','host/p1-semantic-annex.mjs')
 add('adapter_source/host/p1-privacy-envelope.mjs','host/p1-privacy-envelope.mjs')
 add('adapter_source/host/p1-app-exclusive-shell.mjs','host/p1-app-exclusive-shell.mjs')
 add('adapter_source/host/oneshell-thread-session.mjs','host/oneshell-thread-session.mjs')
 add('adapter_source/host/p1-postmode-source-handoff.mjs','host/p1-postmode-source-handoff.mjs')
 add('adapter_source/host/p0-thread-panel-readiness.mjs','host/p0-thread-panel-readiness.mjs')
 add('docs/ONESHELL_THREAD_SESSION_V1.md','docs/ONESHELL_THREAD_SESSION_V1.md')
 add('contracts/p1-p7-product-closure.json','contracts/p1-p7-product-closure.json')
 add('contracts/oneshell-40-product-ci.json','contracts/oneshell-40-product-ci.json')
 add('adapter_source/scripts/host-rehydrate-source-zip.py','scripts/host-rehydrate-source-zip.py')
 template=(ROOT/'project/oneshell-v7/PROMPT_TEMPLATE.txt').read_bytes()
 if gitblob(template)!=git('rev-parse','HEAD:project/oneshell-v7/PROMPT_TEMPLATE.txt'):raise ValueError('PROMPT_TEMPLATE_DRIFT')
 prompt=template.replace(b'@GIT_HEAD@',head.encode()).replace(b'@GIT_TREE@',tree.encode())
 if b'@GIT_' in prompt:raise ValueError('UNBOUND_PROMPT_MARKER')
 commit_raw=subprocess.check_output(['git','-C',str(ROOT),'cat-file','commit',head])
 obj=subprocess.run(['git','hash-object','-t','commit','--stdin'],input=commit_raw,capture_output=True,check=True).stdout.decode().strip()
 if obj!=head:raise ValueError('COMMIT_OBJECT_DRIFT')
 members['PINNED_COMMIT_OBJECT.raw']=commit_raw
 members['PROMPT_INNESCO.txt']=prompt
 # Generate human onboarding from the same verified source epoch; never hardcode old commit filenames.
 instructions=(
  'iKant | Installazione semplice | Fonte '+head+'\n\n'
  '1. Nel Project di ChatGPT incolla PROMPT_INNESCO.txt nelle istruzioni e carica ONESHELL_PROJECT_V7.zip tra i file.\n'
  '2. In una nuova chat scrivi esattamente avvia iKant. Leggi i Termini: il sistema si ferma.\n'
  '3. In un NUOVO messaggio scrivi esattamente I ACCEPT. Il sistema mostra la presentazione e si ferma.\n'
  '4. In un TERZO messaggio scrivi esattamente EDU (consigliato) o CANONICAL.\n'
  '5. Subito dopo la scelta, il sistema controlla il codice gia disponibile. Se manca, apri\n'
  '   https://github.com/Luke883i/iKant_LE/archive/'+head+'.zip\n'
  '   e allega direttamente lo ZIP scaricato a questa chat. Non serve Git o terminale.\n'
  '   Il bundle OneShell NON e lo ZIP completo dei sorgenti; se presenti i sorgenti verificati, non allegare nulla.\n'
  '6. Il codice non installa un plugin: per vedere il pannello grafico serve un app MCP registrata e autorizzata.\n'
  '   Senza app la visualizzazione resta una shell di testo a sei aree; nessuna UI persistente attestata.\n'
  'Stato iniziale: EDU non avviato; CANONICAL non attivo. HEAD='+head+' TREE='+tree+'\n'
 ).encode('utf8')
 members['INSTALLAZIONE.md']=instructions
 lock={'schema':'ikant-le-project-source-lock/v7','source_commit':head,'source_tree':tree,
       'orientation_blobs':{p:meta(members['orientation/'+p])['git_blob_sha1'] for p in ORIENT},
       'plugin_source_blobs':{p:meta(members['plugin_source/plugins/ikant-le-session-chat/'+p])['git_blob_sha1'] for p in PLUGIN},
       'source_is_live_main_attested':False,'plugin_connected':False,'owner_voice_executed':False,
       'stale_head_action':'STOP_SOURCE_LOCK_STALE_NO_AUTO_REPIN'}
 members['SOURCE_LOCK.json']=(json.dumps(lock,indent=2,sort_keys=True)+'\n').encode()
 manifest={'schema':'ikant-le-oneshell-project-release/v7','source_commit':head,'source_tree':tree,
 'source_live_main_verified':False,'native_plugin_installed':False,'project_applied':False,
 'files':{p:meta(b) for p,b in sorted(members.items())}}
 out.mkdir(parents=True,exist_ok=True)
 (out/'PROMPT_INNESCO.txt').write_bytes(prompt)
 (out/'INSTALLAZIONE.md').write_bytes(instructions)
 with zipfile.ZipFile(out/'ONESHELL_PROJECT_V7.zip','w') as z:
  for p,b in sorted(members.items()):zipwrite(z,p,b)
  zipwrite(z,'MANIFEST.json',(json.dumps(manifest,indent=2,sort_keys=True)+'\n').encode())
 return verify(out/'ONESHELL_PROJECT_V7.zip',head,tree)
def verify(zip_path,expected_commit,expected_tree):
 with zipfile.ZipFile(zip_path) as z:
  names=z.namelist()
  if len(names)!=len(set(names)) or any(p.startswith('/') or '..' in Path(p).parts for p in names):raise ValueError('UNSAFE_MEMBERS')
  manifest=json.loads(z.read('MANIFEST.json'));lock=json.loads(z.read('SOURCE_LOCK.json'))
  if manifest['source_commit']!=expected_commit or manifest['source_tree']!=expected_tree or lock['source_commit']!=expected_commit or lock['source_tree']!=expected_tree:raise ValueError('SOURCE_LOCK_STALE')
  if manifest['source_live_main_verified'] or manifest['native_plugin_installed'] or manifest['project_applied'] or lock['source_is_live_main_attested'] or lock['plugin_connected'] or lock['owner_voice_executed']:raise ValueError('UNATTESTED_PROMOTION')
  if set(names)!=set(manifest['files'])|{'MANIFEST.json'}:raise ValueError('MEMBER_SET_DRIFT')
  # A self-consistent manifest is NOT a signed source proof. Re-read every actual
  # repository blob from the pinned checkout before accepting a Project release.
  if git('rev-parse','HEAD')!=expected_commit or git('rev-parse','HEAD^{tree}')!=expected_tree:
   raise ValueError('LOCAL_PINNED_REPOSITORY_UNAVAILABLE')
  for p,v in manifest['files'].items():
   b=z.read(p)
   if meta(b)!=v:raise ValueError('TAMPERED_MEMBER:'+p)
   source=None
   if p.startswith('orientation/'):source=p[len('orientation/'):]
   elif p.startswith('plugin_source/'):source=p[len('plugin_source/'):]
   elif p.startswith('slides/'):source='project/oneshell-v7/'+p[len('slides/'):]
   elif p in ('docs/ONESHELL_THREAD_SESSION_V1.md','contracts/p1-p7-product-closure.json','contracts/oneshell-40-product-ci.json','adapter_source/host/p1-semantic-annex.mjs','adapter_source/host/p1-privacy-envelope.mjs','adapter_source/host/p1-app-exclusive-shell.mjs','adapter_source/host/oneshell-thread-session.mjs','adapter_source/host/p1-postmode-source-handoff.mjs','adapter_source/host/p0-thread-panel-readiness.mjs','adapter_source/scripts/host-rehydrate-source-zip.py'):
    source=p.replace('adapter_source/','')
   if source and git('rev-parse','HEAD:'+source)!=v['git_blob_sha1']:
    raise ValueError('PINNED_GIT_BLOB_MISMATCH:'+p)

  commit_raw=z.read('PINNED_COMMIT_OBJECT.raw')
  obj=subprocess.run(['git','hash-object','-t','commit','--stdin'],input=commit_raw,capture_output=True,check=True).stdout.decode().strip()
  if obj!=expected_commit:raise ValueError('PINNED_COMMIT_OBJECT_DRIFT')
  for p in ORIENT:
   k='orientation/'+p
   if meta(z.read(k))['git_blob_sha1']!=lock['orientation_blobs'][p]:raise ValueError('ORIENTATION_DRIFT')
  for p in PLUGIN:
   k='plugin_source/plugins/ikant-le-session-chat/'+p
   if meta(z.read(k))['git_blob_sha1']!=lock['plugin_source_blobs'][p]:raise ValueError('PLUGIN_DRIFT')
  if expected_commit.encode() not in z.read('PROMPT_INNESCO.txt') or expected_tree.encode() not in z.read('PROMPT_INNESCO.txt'):raise ValueError('PROMPT_SOURCE_BINDING')
  if expected_commit.encode() not in z.read('INSTALLAZIONE.md') or expected_tree.encode() not in z.read('INSTALLAZIONE.md'):raise ValueError('INSTALLER_SOURCE_BINDING')
 return {'ok':True,'source_commit':expected_commit,'source_tree':expected_tree,'file_count':len(manifest['files']),
         'zip_sha256':sha256(zip_path.read_bytes()),'plugin_installed':False,'project_applied':False}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('operation',choices=['build','verify']);p.add_argument('--out',required=True);p.add_argument('--expected-commit',required=True);p.add_argument('--expected-tree',required=True);a=p.parse_args()
 dest=Path(a.out);result=build(dest,a.expected_commit,a.expected_tree) if a.operation=='build' else verify(dest/'ONESHELL_PROJECT_V7.zip',a.expected_commit,a.expected_tree)
 print(json.dumps(result,sort_keys=True))
