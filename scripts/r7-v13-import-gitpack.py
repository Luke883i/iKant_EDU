#!/usr/bin/env python3
"""Import SHA-pinned original R7/V13 Git objects into a dedicated source branch.

This job does NOT change main or the PR branch. It establishes an exact
second-parent source ref used by a separately gated PR merge commit.
"""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from urllib.request import Request, urlopen

REPOSITORY = "Luke883i/iKant_EDU"
MAIN = "8cb80d2230919220ac4b7a1cfcd80950d8467848"
MAIN_TREE = "4cff62ed12f79390a059784bcbf9770788a3a4d1"
ROOT = "27194bb153ff0ab8500bb75277d4d5f7ebb60d45"
SOURCE = "86e20abb714fa4000352b61a0c0abf8795775318"
TARGET_TREE = "07f135d6d54ff69b78cc9e7215daa0bdafa9f84c"
PACK_SHA256 = "0007b1ee2191926b5011dd7a07939bde8a2a743b203acfba467a66e0fb6a1d74"
PACK_SIZE = 834695
SOURCE_BRANCH = "refs/heads/r7-v13-original-semantic-evidence-20261115"
ROOT_B64 = "dHJlZSA0Y2ZmNjJlZDEyZjc5MzkwYTA1OTc4NGJjYmY5NzcwNzg4YTNhNGQxCmF1dGhvciBWMTAgRXZpZGVuY2UgPHYxMEBsb2NhbC5pbnZhbGlkPiAxNzk0NzU2OTQwICswMDAwCmNvbW1pdHRlciBWMTAgRXZpZGVuY2UgPHYxMEBsb2NhbC5pbnZhbGlkPiAxNzk0NzU2OTQwICswMDAwCgpWMTAgcmVjb25zdHJ1Y3RlZCBzb3VyY2Ugc25hcHNob3Q7IHZlcmlmaWVkIEdpdCB0cmVlIG9mIG1haW4gOGNiODBkMiwgTk9UIGhpc3RvcmljYWwgY29tbWl0Cg=="
CHUNKS = [
    ("1b8f35ace24338dd165296a7ea7e6ca0fdbc7496", "682f4e174d5779d6a762172d3b7853fbe417873182af121cf60c2ac960b1ee20", 65536),
    ("687e996c84f445211d49825184def91ecfd33a88", "ec97ba97112e236944f1d712c419e0c7e57c576436016a4ba59825236bdc219f", 65536),
    ("a048c805c76984ed1674cb07050404ee89118d20", "eb6f123b543cc7cb38bc54a252031392264d6a456f0824891adeccd9a33040ab", 65536),
    ("237ed985c50f6312e7861c1254bae7227103b309", "93da144e9718ce54774de0678fddb89bc53086e4add936d764bb85dd7175a70a", 65536),
    ("5680af163f0f5f2d3b8a625f126958962b457b6e", "0b74ff4bda1b7f09282f0d5139194d914a2745e80599eead666bdbcf4ffc6486", 65536),
    ("fe76b85e7ec068a9c74a44bf6357ca4601a64bd7", "001b2ff08fb86f3824e4313b51dbd80f5cc1ff4dbbcaa28527a0ce30b5beb6ac", 65536),
    ("bfa4d72eaba72c86d3820cb15f9a80464ed5f83a", "b50e94804989cc4cc274fb8d1257e9de5c774b8b58274daef98fed2f6feab4fc", 65536),
    ("653c8b4d3172fe5c178ba6ad35701511f3e17f49", "2f2d512d2c98fe2fb2f7b10db5ad233f43b871538276ed0d73fb552330990194", 65536),
    ("9a036e01fe184c3266e57e604bf35d30a671e2bd", "246ed2c377f4543a48ab8b0e65eecb0082dd00c37e0e4d88104664b06e7b80c7", 65536),
    ("d384c8019f52f48de59e182004267707a2136f9b", "556687863c45e2c199102d66cc1c1170cc21019898c1c2274131da14f4ddf7ca", 65536),
    ("fdd2d01455a05581a81fcdf5f171a3babf92929f", "cae264c86b060f17e56b1a87455eace01d0ff6dc580769d02ec5c118f9812f32", 65536),
    ("c6ffb2ed9695feb93c6630a955515526be921d97", "c8df2c59ee9367091a0c550834cc62ed12c3d647e3fcd58a26b61ab8a0032348", 65536),
    ("23c136b8db2d9afb2e578eafb25194113e132355", "8539e4559ccc4117e5133b6cd8f0c7277491dcd75d04e4190f1eeddc4c674e8d", 48263),
]

def require(condition, label):
    if not condition:
        raise RuntimeError(label)


def git(*args, input_bytes=None):
    p = subprocess.run(["git", *args], input=input_bytes, capture_output=True)
    if p.returncode:
        raise RuntimeError("GIT_" + "_".join(args[:3]) + ":" + p.stderr.decode("utf-8", "replace")[:400])
    return p.stdout.decode("utf-8", "replace").strip()


def hash_git_blob(content):
    return hashlib.sha1(b"blob " + str(len(content)).encode("ascii") + b"\0" + content).hexdigest()


def chunk_from_api(sha, token):
    require(bool(token), "GITHUB_TOKEN_MISSING")
    req = Request(
        "https://api.github.com/repos/" + REPOSITORY + "/git/blobs/" + sha,
        headers={"Authorization": "Bearer " + token,
                 "Accept": "application/vnd.github+json",
                 "X-GitHub-Api-Version": "2022-11-28",
                 "User-Agent": "r7-v13-evidence-import/1"})
    with urlopen(req, timeout=40) as response:
        doc = json.loads(response.read())
    require(doc.get("sha") == sha and doc.get("encoding") == "base64", "GITHUB_BLOB_API_MISMATCH")
    return base64.b64decode(doc["content"].encode("ascii"), validate=False)


def rebuild(local_dir=None):
    token = os.environ.get("GITHUB_TOKEN", "")
    segments = []
    for number, (sha, digest, size) in enumerate(CHUNKS):
        if local_dir is not None:
            segment = (local_dir / ("chunk_%02d.bin" % number)).read_bytes()
        else:
            segment = chunk_from_api(sha, token)
        require(len(segment) == size, "CHUNK_LENGTH_%02d" % number)
        require(hashlib.sha256(segment).hexdigest() == digest, "CHUNK_SHA256_%02d" % number)
        require(hash_git_blob(segment) == sha, "CHUNK_GIT_SHA1_%02d" % number)
        segments.append(segment)
        print("chunk", number, "verified", file=sys.stderr)
    result = b"".join(segments)
    require(len(result) == PACK_SIZE, "PACK_LENGTH_MISMATCH")
    require(hashlib.sha256(result).hexdigest() == PACK_SHA256, "PACK_SHA256_MISMATCH")
    return result


def run(args):
    assert not args.push or args.local_dir is None, "NO_PUSH_WITH_LOCAL_FIXTURE"
    if args.local_dir is None:
        require(git("rev-parse", MAIN) == MAIN, "REAL_MAIN_COMMIT_NOT_AVAILABLE")
        require(git("rev-parse", MAIN + "^{tree}") == MAIN_TREE, "REAL_MAIN_TREE_DRIFT")
    else:
        require(git("rev-parse", "HEAD^{tree}") == MAIN_TREE, "BASELINE_FIXTURE_TREE_DRIFT")
    require(git("rev-parse", "HEAD").isalnum(), "HEAD_NOT_OBSERVABLE")
    require(not git("status", "--porcelain"), "DIRTY_SOURCE_CHECKOUT")
    if args.push:
        require(os.environ.get("GITHUB_REPOSITORY") == REPOSITORY, "WRONG_REPOSITORY")
        require(os.environ.get("GITHUB_REF") == "refs/heads/refactor/r7-v13-semantic-transplant-gated-20261115", "WRONG_BRANCH")
    pack = rebuild(args.local_dir)
    root_commit = base64.b64decode(ROOT_B64)
    require(hashlib.sha256(root_commit).hexdigest() == "f9fd5b01ef22bb301c3c11f4f136eff64777749b4346a641a0f51ec6cad1a86a", "ROOT_SOURCE_BYTES_DRIFT")
    require(git("hash-object", "-t", "commit", "-w", "--stdin", input_bytes=root_commit) == ROOT, "ROOT_COMMIT_SHA_DRIFT")
    p = subprocess.run(["git", "index-pack", "--fix-thin", "--stdin"], input=pack, capture_output=True)
    require(p.returncode == 0, "INDEX_PACK_FAILED:" + p.stderr.decode("utf-8", "replace")[:400])
    require(git("rev-parse", SOURCE + "^{tree}") == TARGET_TREE, "V13_TREE_MISMATCH")
    require(git("rev-list", "--count", ROOT + ".." + SOURCE) == "35", "V13_SEMANTIC_COMMIT_COUNT_DRIFT")
    require(git("rev-parse", ROOT + "^{tree}") == MAIN_TREE, "SYNTHETIC_ROOT_TREE_MISMATCH")
    require(git("merge-base", "--is-ancestor", ROOT, SOURCE) == "", "ROOT_NOT_ANCESTOR")
    git("fsck", "--full", "--no-reflogs")
    if args.push:
        git("push", "--porcelain", "origin", SOURCE + ":" + SOURCE_BRANCH)
        status = "SOURCE_BRANCH_PUBLISHED"
    else:
        status = "LOCAL_GIT_OBJECT_IMPORT_PASS"
    receipt = {"schema": "r7-pr249-source-pack-import/v1", "status": status,
               "main": MAIN, "source": SOURCE, "source_root": ROOT,
               "source_tree": TARGET_TREE, "semantic_commits": 35,
               "git_pack_sha256": PACK_SHA256, "git_pack_bytes": PACK_SIZE,
               "chunk_count": len(CHUNKS), "owner_review": "NOT_ATTESTED",
               "cora_process_run": "DEBT_BLOCKED", "global_dod": "HOLD", "product_go": False}
    Path(args.receipt).write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(receipt, sort_keys=True))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--local-dir", type=Path, help="local fixture directory (never push)")
    parser.add_argument("--push", action="store_true", help="publish exact source SHA as dedicated branch")
    parser.add_argument("--receipt", type=Path, default=Path("/tmp/r7-v13-pack-import.json"))
    try:
        run(parser.parse_args())
    except Exception as e:
        error = str(e)[:600]
        receipt = {"schema": "r7-pr249-import-failure/v1", "status": "BLOCKED",
                   "error": error, "global_dod": "HOLD", "product_go": False}
        try:
            args = parser.parse_args()
            Path(args.receipt).write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
        except Exception:
            pass
        print("V13_IMPORT_BLOCKED:" + error, file=sys.stderr)
        sys.exit(20)
