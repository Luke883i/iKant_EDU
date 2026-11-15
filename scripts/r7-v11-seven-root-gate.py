#!/usr/bin/env python3
"""CORA-METHOD L1: bounded, fail-closed seven-root migration audit.
Neither a CORA-ENGINE invocation nor independent Project/MCP runtime proof.
"""
import pathlib,subprocess,json,re,sys,posixpath,hashlib,stat
R=pathlib.Path(__file__).resolve().parent.parent
SPEC=json.loads((R/'contracts/r7-v11-seven-root-contract.json').read_text())
def git(*args):
 p=subprocess.run(['git',*args],cwd=R,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 if p.returncode: raise RuntimeError('GIT:'+':'.join(args[:2])+':'+p.stderr.decode(errors='replace')[:120])
 return p.stdout
def mv(p):
 if p in SPEC['moved_root_files']:return SPEC['moved_root_files'][p]
 root=p.split('/')[0]
 if root in SPEC['moved_roots']:return SPEC['moved_roots'][root]+p[len(root):]
 return p
def tree(ref):
 out={}
 for item in git('ls-tree','-r','-z',ref).split(b'\0'):
  if not item:continue
  info,name=item.split(b'\t',1);mode,typ,sha=info.decode().split(' ')
  if typ!='blob':raise ValueError('UNSUPPORTED_TREE:'+typ)
  out[name.decode()]={'sha':sha,'mode':mode}
 return out
# JS source-relative ESM, require, static dynamic import and URL() patterns
PATTERNS={
 'from':re.compile(r'\bfrom\s*[\'\"](\.{1,2}/[^\'\"]+)[\'\"]'),
 'side':re.compile(r'\bimport\s*[\'\"](\.{1,2}/[^\'\"]+)[\'\"]'),
 'dynamic':re.compile(r'\bimport\s*\(\s*[\'\"](\.{1,2}/[^\'\"]+)[\'\"]\s*\)'),
 'require':re.compile(r'\brequire\s*\(\s*[\'\"](\.{1,2}/[^\'\"]+)[\'\"]\s*\)'),
 'url':re.compile(r'\bnew\s+URL\s*\(\s*[\'\"](\.{1,2}/[^\'\"]+)[\'\"]\s*,\s*import\.meta\.url')}
LINKS=re.compile(r'\]\(<?([^)<>\s]+)>?\)')
def target(p,s):
 q=s.split('#',1)[0].split('?',1)[0]
 return posixpath.normpath(posixpath.join(posixpath.dirname(p),q))
def load_base(p):return git('show',SPEC['v10_parent']+':'+p).decode('utf8','replace')
def inspect_edges(pre,post):
 missing=[];source_count=0;resolved=0;inherited=0;changed=[]
 for original in sorted(pre):
  if not original.endswith(('.mjs','.js','.cjs','.ts','.mts')):continue
  before=load_base(original);dest=mv(original)
  if dest not in post:continue
  now=(R/dest).read_text(errors='replace')
  for kind,pat in PATTERNS.items():
   o=pat.findall(before);n=pat.findall(now)
   if len(o)!=len(n):
    missing.append({'file':original,'kind':kind,'error':'EDGE_CARDINALITY_DRIFT','before':len(o),'after':len(n)});continue
   for a,b in zip(o,n):
    source_count+=1
    aTarget=target(original,a);bTarget=target(dest,b)
    if aTarget in pre:
     if mv(aTarget)!=bTarget or bTarget not in post:
      missing.append({'file':original,'kind':kind,'old':a,'new':b,'expected_target':mv(aTarget),'actual_target':bTarget})
     else: resolved+=1
    else:inherited+=1
 return {'count':source_count,'expected_resolved':resolved,'inherited_unresolved':inherited,'broken':missing[:100],'broken_count':len(missing)}
def inspect_links(pre,post):
 bad=[];checked=0
 for original in sorted(pre):
  if not original.endswith('.md'):continue
  before=load_base(original);dest=mv(original)
  if dest not in post:continue
  now=(R/dest).read_text(errors='replace')
  o=LINKS.findall(before);n=LINKS.findall(now)
  if len(o)!=len(n):
   bad.append({'path':original,'error':'LINK_CARDINALITY','old':len(o),'new':len(n)});continue
  for a,b in zip(o,n):
   if a.startswith(('#','http:','https:','mailto:','data:','//','javascript:')) or a.startswith('/'):
    continue
   at=target(original,a)
   if at not in pre:continue
   bt=target(dest,b);checked+=1
   if bt!=mv(at):bad.append({'path':original,'target':a,'now':b,'expected':mv(at),'actual':bt})
 return {'checked_internal':checked,'broken_count':len(bad),'broken':bad[:100]}
def main():
 pre=tree(SPEC['v10_parent']);post=tree('HEAD')
 required={mv(p) for p in pre};present=set(post)
 unexpected_absent=sorted(required-present)
 added=sorted(present-required)
 roots=sorted({p.split('/')[0] for p in present if '/' in p})
 rootfiles=sorted(p for p in present if '/' not in p)
 root_ok=roots==sorted(SPEC['root_dirs']) and rootfiles==sorted(SPEC['root_files']) and SPEC.get('product_go') is False and SPEC.get('original_tree')=='4cff62ed12f79390a059784bcbf9770788a3a4d1'
 pre_modes={mv(p):v['mode'] for p,v in pre.items()}
 bad_modes=[p for p in required&present if post[p]['mode']!=pre_modes[p]]
 changed=[{'before':p,'after':mv(p)} for p in pre if post.get(mv(p),{}).get('sha')!=pre[p]['sha']]
 e=inspect_edges(pre,post);m=inspect_links(pre,post)
 fsck=subprocess.run(['git','fsck','--full','--no-reflogs'],cwd=R,capture_output=True,text=True,timeout=60)
 source_tree=git('rev-parse',SPEC['v10_parent']+'^{tree}').decode().strip()
 dirty=bool(git('status','--porcelain','--untracked-files=no').strip())
 byte_drift=[]
 for p,v in post.items():
  f=R/p
  try:
   st=f.lstat(); b=f.read_bytes()
   sha=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
   if not stat.S_ISREG(st.st_mode) or sha!=v['sha']:byte_drift.append(p)
  except (OSError,ValueError):byte_drift.append(p)
 ancestor=subprocess.run(['git','merge-base','--is-ancestor',SPEC['v10_parent'],'HEAD'],cwd=R).returncode==0
 source_ok=ancestor and source_tree==SPEC['v10_tree']
 gates={
  'T_SEVEN_DIRS_NINE_ROOT_FILES':root_ok,
  'B_ONE_TO_ONE_ORIGINAL_BLOBS':not unexpected_absent and not bad_modes and source_ok,
  'I_RELATIVE_MODULE_TARGET_EQUIVALENCE':e['broken_count']==0,
  'D_MARKDOWN_LINK_TARGET_EQUIVALENCE':m['broken_count']==0,
  'F_GIT_OBJECT_INTEGRITY':fsck.returncode==0 and not dirty and not byte_drift,
  'A_OWNER_RUNTIME_BEHAVIOR':'NOT_ATTESTED',
  'CORA_ENGINE_REPORT':'NOT_RUN',
  'FULL_NATIVE_TEST_SUITE':'NOT_RUN',
  'EXTERNAL_CONSUMERS_AND_REVIEW':'NOT_ATTESTED',
  'CI_EXACT_SHA':'NOT_RUN'
 }
 out={'schema':'ikant-r7-v11-audit-receipt/v1','base_v10':SPEC['v10_parent'],
 'head':git('rev-parse','HEAD').decode().strip(),'tree':git('rev-parse','HEAD^{tree}').decode().strip(),
 'main_source_tree':SPEC['original_tree'],'directories':roots,'root_files':rootfiles,
 'source_files':len(pre),'candidate_files':len(post),'new_files':added,
 'moved_files':sum(mv(p)!=p for p in pre),'files_modified_byte_level':len(changed),
 'missing_original':unexpected_absent,'changed_modes':bad_modes,'dirty_worktree':dirty,'byte_drift':byte_drift[:30],'relative':e,'markdown':m,
 'gates':gates,'observed_scoped_green':all(v is True for k,v in gates.items() if k in ['T_SEVEN_DIRS_NINE_ROOT_FILES','B_ONE_TO_ONE_ORIGINAL_BLOBS','I_RELATIVE_MODULE_TARGET_EQUIVALENCE','D_MARKDOWN_LINK_TARGET_EQUIVALENCE','F_GIT_OBJECT_INTEGRITY']),
 'global_dod':'HOLD','product_go':False,
 'interpretation':'L1 static graph: absence of listed mismatches is not runtime equivalence; fail closed until native suite/CORA/review/CI.'}
 print(json.dumps(out,indent=2))
 return 20 if '--require-global' in sys.argv else (0 if out['observed_scoped_green'] else 20)
if __name__=='__main__':
 try:sys.exit(main())
 except Exception as ex:
  print(json.dumps({'schema':'ikant-r7-v11-gate-error/v1','status':'BLOCKED','reason':str(ex)[:300], 'product_go':False}),file=sys.stderr)
  sys.exit(21)
