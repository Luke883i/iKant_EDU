#!/usr/bin/env python3
"""R7 source-bound forensic atlas. Authority zero: indexing != semantic proof."""
import argparse
import ast
import collections
import hashlib
import io
import json
import pathlib
import posixpath
import re
import subprocess
import sys
import tarfile

DIMS = ("IDENTITY", "STRUCTURE", "INTENT", "CONTRIBUTION", "SYMBOLS",
        "INBOUND", "OUTBOUND", "EFFECTS", "TEMPORALITY",
        "COUNTERFACTUAL", "RETENTION")
FIELDS = ("source_head", "source_tree", "cards", "edges", "measurements")
JS_REF = re.compile(r"""(?:\b(?:import|export)\s+(?:[^\n;]*?\s+from\s+)?|\brequire\s*\(|\bimport\s*\()\s*(['"])(\.{1,2}/[^'"\n]+)\1""")
URL_REF = re.compile(r"""new\s+URL\s*\(\s*(['"])(\.{1,2}/[^'"\n]+)\1\s*,\s*import\.meta\.url""")
MD_REF = re.compile(r"(?<!!)\]\(([^)\s#]+)(?:#[^)]*)?\)")
FULL_PATH = re.compile(r"(?<![\w./-])(?:\.github|assets|artifacts|contracts|docs|governance|host|plugins|project|project-baseline|release|runtime-root|scripts|src|tests)/[A-Za-z0-9_./+-]+")
SYMBOL = re.compile(r"\b(?:export\s+(?:async\s+)?(?:function|const|class|let)|(?:def|class)\s+)\s*([\w$]+)")
EFFECT = re.compile(r"\b(?:writeFileSync|appendFileSync|renameSync|mkdirSync|rmSync|unlinkSync|spawnSync|execFileSync|createServer|fetch)\b")
DYNAMIC = re.compile(r"\b(?:import|require)\s*\(\s*(?!['\"])|(?:path\.join|path\.resolve|glob|git show|HEAD:)", re.I)
TEMPORAL = re.compile(r"\b(?:historical|legacy|archive|prepr|candidate|current|deprecated|experimental|canonical)\b", re.I)
ENTRY = {"README.md", "AGENTS.md", "ADMISSION.json", "BOOTSTRAP.json",
         "TERMS.md", "ikant.mjs", "project/session-chat/PROMPT.txt",
         "plugins/ikant-le-session-chat/server/server.mjs", "release/catalog.json"}

def git(root, *args, binary=True):
    raw = subprocess.check_output(["git", "-C", str(root), *args], stderr=subprocess.PIPE)
    return raw if binary else raw.decode("utf-8").strip()

def blob_sha(raw):
    return hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()

def catalog(root):
    entries = {}
    for chunk in git(root, "ls-files", "--stage", "-z").split(b"\0"):
        if not chunk:
            continue
        left, p = chunk.split(b"\t", 1)
        mode, sha, stage = left.decode().split(" ")
        path = p.decode("utf-8", "surrogateescape")
        if stage != "0" or mode not in ("100644", "100755"):
            raise ValueError("R7_NONREGULAR_OR_UNMERGED:" + path)
        if path.startswith("/") or "\\" in path or ".." in path.split("/"):
            raise ValueError("R7_PATH_UNSAFE:" + path)
        entries[path] = (sha, mode)
    return entries

def cat_file(root, entries):
    names = sorted(entries)
    payload = "".join(entries[p][0] + "\n" for p in names).encode()
    stream = subprocess.run(["git", "-C", str(root), "cat-file", "--batch"],
                            input=payload, capture_output=True, check=True).stdout
    out, index = {}, 0
    for p in names:
        end = stream.index(b"\n", index)
        sha, typ, size = stream[index:end].decode().split()
        n = int(size)
        raw = stream[end + 1:end + 1 + n]
        index = end + n + 2
        if typ != "blob" or sha != entries[p][0] or blob_sha(raw) != sha or stream[index - 1:index] != b"\n":
            raise ValueError("R7_GIT_BLOB_INVALID:" + p)
        disk = root / p
        if not disk.is_file() or disk.is_symlink() or disk.read_bytes() != raw:
            raise ValueError("R7_WORKTREE_SOURCE_DRIFT:" + p)
        out[p] = raw
    if index != len(stream):
        raise ValueError("R7_CAT_FILE_TRAILING")
    return out

def archive_independently(root, entries):
    data = git(root, "archive", "--format=tar", "HEAD")
    out = {}
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:") as ar:
        for item in ar:
            if item.isdir():
                continue
            if not item.isfile() or item.name in out:
                raise ValueError("R7_ARCHIVE_NONREGULAR_OR_DUPLICATE")
            raw = ar.extractfile(item).read()
            out[item.name] = raw
    if set(out) != set(entries):
        raise ValueError("R7_ARCHIVE_PATH_SET_MISMATCH")
    for p, raw in out.items():
        if blob_sha(raw) != entries[p][0]:
            raise ValueError("R7_ARCHIVE_BLOB_INVALID:" + p)
    return out

def family(p, raw):
    if b"\0" in raw:
        return "binary"
    try:
        raw.decode("utf-8")
    except UnicodeDecodeError:
        return "binary"
    ext = pathlib.PurePosixPath(p).suffix.lower()
    return {".mjs":"javascript",".js":"javascript",".cjs":"javascript",
            ".py":"python",".json":"json",".jsonl":"jsonl",".md":"markdown",
            ".yaml":"yaml",".yml":"yaml",".csv":"csv",".svg":"svg"}.get(ext,"text")

def structure(p, fam, text):
    if fam == "binary":
        return {"status":"NON_TEXT_REQUIRES_FORMAT_REVIEW","units":[]}
    try:
        if fam == "json":
            o = json.loads(text)
            units = list(o)[:64] if isinstance(o,dict) else ["array:"+str(len(o))] if isinstance(o,list) else ["scalar"]
            return {"status":"PARSED","units":units}
        if fam == "jsonl":
            lines = [x for x in text.splitlines() if x.strip()]
            for line in lines: json.loads(line)
            return {"status":"PARSED","units":["records:"+str(len(lines))]}
        if fam == "python":
            tree = ast.parse(text)
            return {"status":"PARSED","units":[x.name for x in tree.body if isinstance(x,(ast.FunctionDef,ast.AsyncFunctionDef,ast.ClassDef))][:64]}
        if fam == "markdown":
            return {"status":"TOKENIZED_NOT_AST","units":[x.lstrip("# ").strip()[:120] for x in text.splitlines() if re.match(r"^#{1,6} ",x)][:64]}
        if fam == "javascript":
            return {"status":"TOKENIZED_NOT_AST","units":SYMBOL.findall(text)[:64]}
        return {"status":"OPAQUE_OR_TEXT","units":[]}
    except (ValueError, SyntaxError, json.JSONDecodeError) as exc:
        return {"status":"PARSE_FAILED","units":[],"error":type(exc).__name__}

def role(path):
    root = path.split("/")[0]
    return {
      "host":"HOST_ORIGINAL_OR_ADAPTER","src":"CORE_LIBRARY_OR_RUNTIME",
      "contracts":"MACHINE_CONTRACT","docs":"DOCUMENT_CURRENT_OR_HISTORICAL_UNKNOWN",
      "tests":"TEST_OR_FIXTURE","scripts":"BUILD_AUDIT_OR_GENERATOR",
      ".github":"CI_CONSUMER","plugins":"MCP_SURFACE",
      "project":"PROJECT_SURFACE","governance":"GOVERNANCE_RECORD",
      "artifacts":"EVIDENCE_OR_ARCHIVE","release":"RELEASE_METADATA",
      "runtime-root":"RUNTIME_RESOURCE"}.get(root,"ROOT_ENTRY" if path in ENTRY else "OTHER_REQUIRES_REVIEW")

def resolve(source, ref, paths):
    if not ref.startswith(("./","../")): return None
    p = posixpath.normpath(posixpath.join(posixpath.dirname(source),ref.split("#",1)[0]))
    for candidate in (p,p+".mjs",p+".js",p+".json",p+"/index.mjs"):
        if candidate in paths: return candidate
    return None

def scan(root, expected_head):
    root = pathlib.Path(root).resolve()
    head,tree = git(root,"rev-parse","HEAD",binary=False),git(root,"rev-parse","HEAD^{tree}",binary=False)
    if head != expected_head or not re.fullmatch(r"[0-9a-f]{40}", expected_head):
        raise ValueError("R7_EXPECTED_HEAD_MISMATCH")
    if git(root,"status","--porcelain","--untracked-files=no").strip():
        raise ValueError("R7_TRACKED_SOURCE_DIRTY")
    entries=catalog(root)
    blobs=cat_file(root,entries)
    archived=archive_independently(root,entries)
    if any(blobs[p]!=archived[p] for p in entries):
        raise ValueError("R7_INDEPENDENT_GIT_READBACK_MISMATCH")
    paths=set(entries); cards=[];edges=[];unresolved=[]; inbound=collections.Counter();outbound=collections.Counter()
    for p in sorted(entries):
        raw=blobs[p]; fam=family(p,raw)
        text=raw.decode("utf-8") if fam!="binary" else ""
        refs=[]
        if fam=="javascript":
            refs.extend(("JS_STATIC",m.group(2)) for m in JS_REF.finditer(text))
            refs.extend(("IMPORT_META_URL",m.group(2)) for m in URL_REF.finditer(text))
        if fam=="markdown":
            refs.extend(("MD_LINK",m.group(1)) for m in MD_REF.finditer(text))
        for t,ref in refs:
            tar=resolve(p,ref,paths)
            if tar:
                edges.append({"consumer":p,"target":tar,"type":t,"expression":ref,"consumer_blob":entries[p][0],"target_blob":entries[tar][0]})
                outbound[p]+=1; inbound[tar]+=1
            elif ref.startswith(("./","../")):
                unresolved.append({"consumer":p,"reference":ref,"type":t,"status":"UNKNOWN_NOT_UNUSED"})
        for token in set(FULL_PATH.findall(text)):
            if token in paths and token!=p:
                edges.append({"consumer":p,"target":token,"type":"PATH_MENTION","expression":token,"consumer_blob":entries[p][0],"target_blob":entries[token][0]})
                outbound[p]+=1;inbound[token]+=1
        card={"path":p,"git_sha1":entries[p][0],"mode":entries[p][1],
          "bytes":len(raw),"sha256":hashlib.sha256(raw).hexdigest(),"family":fam,
          "structure":structure(p,fam,text),"role_hypothesis":role(p),
          "first_lines":[s.strip()[:180] for s in text.splitlines() if s.strip()][:3],
          "symbols":SYMBOL.findall(text)[:64] if fam=="javascript" else [],
          "effects_signals":sorted(set(EFFECT.findall(text))),
          "dynamic_path_signal":bool(DYNAMIC.search(text)),
          "temporal_signals":sorted(set(x.lower() for x in TEMPORAL.findall(text))),
          "incoming":0,"outgoing":0,"external_consumers":"UNKNOWN",
          "safe_to_retire":False,"source_indexed":True,
          "semantic_status":"HYPOTHESIS_NOT_INDEPENDENTLY_PROVED",
          "dod_dimensions":[{"id":d,"status":"REQUIRES_FILE_SPECIFIC_WITNESS"} for d in DIMS]}
        cards.append(card)
    for c in cards: c["incoming"]=inbound[c["path"]];c["outgoing"]=outbound[c["path"]]
    roots=collections.Counter(p.split("/")[0] for p in entries if "/" in p)
    m={"file_count":len(cards),"unique_blobs":len(set(x[0] for x in entries.values())),
       "root_files":sum("/" not in p for p in entries),
       "root_dirs":dict(sorted(roots.items())),"total_bytes":sum(len(x) for x in blobs.values()),
       "typed_edges":len(edges),"unresolved_static_refs":len(unresolved),
       "dynamic_signal_files":sum(c["dynamic_path_signal"] for c in cards),
       "nontext_files":sum(c["family"]=="binary" for c in cards),
       "syntax_parse_failed":sum(c["structure"]["status"]=="PARSE_FAILED" for c in cards),
       "dimensions_total":len(cards)*len(DIMS),"dimensions_proved":0,
       "all_original_bytes_reopened":len(cards)==len(entries)}
    return {"schema":"ikant-r7-original-content-audit/v2","source_head":head,
      "source_tree":tree,"source_scope":"CURRENT_GIT_EPOCH_NOT_SYNTHETIC",
      "historical_r7_head":"b2f550043d5fca89ab1d1efc2ee06a0c7c163f2c",
      "cards":cards,"edges":edges,"unresolved":unresolved,"measurements":m,
      "all_file_semantics_proven":False,"retirement_authorized":False,
      "native_provider_attested":False,"cora_engine_executed":False,"product_go":False}

def verify(report, root, expected_head):
    if report.get("schema")!="ikant-r7-original-content-audit/v2" or report.get("source_head")!=expected_head:
        raise ValueError("R7_REPORT_SOURCE_FORGED")
    entries=catalog(pathlib.Path(root).resolve())
    archived=archive_independently(pathlib.Path(root).resolve(),entries)
    current_tree=git(root,"rev-parse","HEAD^{tree}",binary=False)
    if report.get("source_tree")!=current_tree:
        raise ValueError("R7_SOURCE_TREE_DRIFT")
    for name in ("all_file_semantics_proven","retirement_authorized",
                 "native_provider_attested","cora_engine_executed","product_go"):
        if report.get(name) is not False:
            raise ValueError("R7_FALSE_ASSURANCE_PROMOTION:"+name)
    cards=report.get("cards",[])
    bypath={c.get("path"):c for c in cards if isinstance(c,dict)}
    if len(cards)!=len(entries) or len(bypath)!=len(entries) or set(bypath)!=set(entries):
        raise ValueError("R7_FILE_COVERAGE_FALSE")
    for p, (sha,mode) in entries.items():
        c=bypath[p]; raw=archived[p]
        if (c.get("git_sha1")!=sha or c.get("mode")!=mode or
            c.get("bytes")!=len(raw) or c.get("sha256")!=hashlib.sha256(raw).hexdigest() or
            c.get("family")!=family(p,raw)):
            raise ValueError("R7_FILE_EVIDENCE_CHANGED:"+p)
        if (c.get("semantic_status")!="HYPOTHESIS_NOT_INDEPENDENTLY_PROVED"
            or c.get("safe_to_retire") is not False or c.get("external_consumers")!="UNKNOWN"
            or len(c.get("dod_dimensions",[]))!=len(DIMS)
            or [x.get("id") for x in c["dod_dimensions"]]!=list(DIMS)
            or any(x.get("status")!="REQUIRES_FILE_SPECIFIC_WITNESS" for x in c["dod_dimensions"])):
            raise ValueError("R7_FALSE_FILE_MEANING_OR_DOD:"+p)
    edges=report.get("edges",[]); ins=collections.Counter();outs=collections.Counter()
    for e in edges:
        p,t=e.get("consumer"),e.get("target")
        if p not in entries or t not in entries or e.get("consumer_blob")!=entries[p][0] or e.get("target_blob")!=entries[t][0]:
            raise ValueError("R7_FORGED_CONSUMER_EDGE")
        if e.get("expression") not in archived[p].decode("utf-8","ignore"):
            raise ValueError("R7_UNSUPPORTED_CONSUMER_EDGE")
        ins[t]+=1;outs[p]+=1
    if any(c["incoming"]!=ins[c["path"]] or c["outgoing"]!=outs[c["path"]] for c in cards):
        raise ValueError("R7_FALSE_CONSUMER_COUNTS")
    m=report.get("measurements",{})
    if (m.get("file_count")!=len(entries) or m.get("typed_edges")!=len(edges)
        or m.get("dimensions_total")!=len(entries)*len(DIMS)
        or m.get("dimensions_proved")!=0 or m.get("all_original_bytes_reopened") is not True):
        raise ValueError("R7_FALSE_TOTAL")
    return {"status":"PASS_ORIGINAL_BYTES_AND_INDEX_ONLY",
            "source_head":expected_head,"files_verified":len(entries),
            "semantic_comprehension":"NOT_ATTESTED","product_go":False}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--repo",required=True)
    parser.add_argument("--expected-head",required=True)
    parser.add_argument("--out")
    parser.add_argument("--verify")
    args=parser.parse_args()
    try:
        if args.verify:
            report=json.loads(pathlib.Path(args.verify).read_text("utf-8"))
        else:
            if not args.out: raise ValueError("R7_OUTPUT_REQUIRED")
            report=scan(args.repo,args.expected_head)
            dst=pathlib.Path(args.out);dst.parent.mkdir(parents=True,exist_ok=True)
            dst.write_text(json.dumps(report,ensure_ascii=False,sort_keys=True,indent=2)+"\n",encoding="utf-8")
        result=verify(report,args.repo,args.expected_head)
        result["measurements"]=report["measurements"]
        print(json.dumps(result,sort_keys=True))
    except Exception as exc:
        print(json.dumps({"status":"R7_HOLD","first_edge":str(exc),"product_go":False}))
        return 2
    return 0

if __name__=="__main__":
    sys.exit(main())
