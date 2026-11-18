#!/usr/bin/env python3
"""CORA L1: source-bound, append-only physical migration evidence.

Never promotes historical governance records, owner/CI receipts, or release.
The historic register stays byte-identical; the new source epoch is a *projection*.
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PLAN = 'contracts/r7-v11-seven-root-contract.json'
V11_HEAD = '30b8021e1f6659acd79cc96d3bc106a1742697e4'
HISTORY = 'c9a1179283958a7ffb30d1ad8c08af69d34fff0c'
SOURCE_TREE = '9b6b80d7fe2f8536b9ce8633e09810fc87b81c28'
ROOTS = ('.github', 'contracts', 'host', 'project', 'scripts', 'src', 'tests')
ROOT_FILES = ('.gitignore', 'ADMISSION.json', 'AGENTS.md', 'BOOTSTRAP.json',
              'LICENSE', 'README.md', 'TERMS.md', 'ikant.mjs', 'package.json')


def git(*args, binary=False):
    p = subprocess.run(['git', *args], cwd=ROOT, stdout=subprocess.PIPE,
                       stderr=subprocess.PIPE, timeout=55)
    if p.returncode:
        raise ValueError('GIT_UNREADABLE:' + ':'.join(args[:2]) + ':' + p.stderr.decode('utf8', 'replace')[:120])
    return p.stdout if binary else p.stdout.decode('utf8').strip()


def tree(commit):
    result = {}
    for row in git('ls-tree', '-r', '-z', commit, binary=True).split(b'\0'):
        if not row:
            continue
        meta, p = row.split(b'\t', 1)
        mode, kind, sha = meta.decode().split(' ')
        if kind != 'blob':
            raise ValueError('NON_BLOB_TREE_OBJECT')
        key = p.decode('utf8')
        if key in result:
            raise ValueError('DUPLICATE_TREE_ENTRY')
        result[key] = (sha, mode)
    return result


def move(path, plan):
    if path in plan['moved_root_files']:
        return plan['moved_root_files'][path]
    first = path.split('/')[0]
    if first in plan['moved_roots']:
        return plan['moved_roots'][first] + path[len(first):]
    return path


def safe(path):
    return isinstance(path, str) and path and not path.startswith('/') and '\\' not in path and all(
        part not in ('', '.', '..') for part in path.split('/'))


def audit(plan=None, old=None, current=None, *, worktree=True, revision='HEAD'):
    problems = []
    p = plan if plan is not None else json.loads((ROOT / PLAN).read_text())
    if p.get('schema') != 'ikant-r7-v11-seven-root-contract/v1' or p.get('product_go') is not False or p.get('v10_parent') != HISTORY or p.get('v10_tree') != SOURCE_TREE or p.get('original_tree') != '4cff62ed12f79390a059784bcbf9770788a3a4d1':
        problems.append('EPOCH_CONTRACT_REWRITTEN')
    original = old if old is not None else tree(HISTORY)
    candidate = current if current is not None else tree(revision)
    actual_tree = git('rev-parse', HISTORY + '^{tree}')
    if actual_tree != SOURCE_TREE:
        problems.append('HISTORIC_SOURCE_TREE_MISMATCH')
    if subprocess.run(['git', 'merge-base', '--is-ancestor', V11_HEAD, revision], cwd=ROOT).returncode:
        problems.append('V11_NOT_ANCESTOR')
    if git('show', V11_HEAD + ':' + PLAN, binary=True) != (ROOT / PLAN).read_bytes():
        problems.append('MOVE_PLAN_CHANGED_AFTER_V11')
    mapping = {}
    for name in original:
        dest = move(name, p)
        if not safe(dest):
            problems.append('UNSAFE_DESTINATION:' + name)
        if dest in mapping.values():
            problems.append('MAPPING_COLLISION:' + dest)
        mapping[name] = dest
    missing = sorted((src, dst) for src, dst in mapping.items() if dst not in candidate)
    if missing:
        problems.append('ORIGINAL_BLOBS_MISSING:' + str(len(missing)))
    modes = [(src, dst) for src, dst in mapping.items() if dst in candidate and original[src][1] != candidate[dst][1]]
    if modes:
        problems.append('GIT_MODES_CHANGED:' + str(len(modes)))
    roots = sorted({name.split('/')[0] for name in candidate if '/' in name})
    rootfiles = sorted(name for name in candidate if '/' not in name)
    if roots != sorted(ROOTS) or rootfiles != sorted(ROOT_FILES):
        problems.append('TOPOLOGY_NOT_SEVEN_BY_NINE')
    governance = sorted(src for src in original if src.startswith('governance/'))
    if len(governance) != 50:
        problems.append('HISTORICAL_GOVERNANCE_COUNT_DRIFT')
    historic_drift = [src for src in governance if candidate.get(mapping[src], ('',))[0] != original[src][0]]
    if historic_drift:
        problems.append('HISTORICAL_GOVERNANCE_BYTES_REWRITTEN:' + str(len(historic_drift)))
    sha1 = hashlib.sha1
    if worktree and revision == 'HEAD':
        if git('status', '--porcelain', '--untracked-files=no'):
            problems.append('TRACKED_WORKTREE_DIRTY')
        if git('ls-files', '-z', binary=True).split(b'\0')[:-1] != sorted(x.encode('utf8') for x in candidate):
            problems.append('INDEX_TREE_PATH_MISMATCH')
        for name, (blob, mode) in candidate.items():
            f = ROOT / name
            if not f.is_file() or f.is_symlink():
                problems.append('UNSAFE_FILE:' + name)
                break
            b = f.read_bytes()
            if sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest() != blob:
                problems.append('FILE_BYTES_NOT_COMMITTED:' + name)
                break
    protected = {}
    for current_path in p.get('never_declassify_without_review', []):
        src = next((original_path for original_path, dst in mapping.items() if dst == current_path), None)
        if src is None:
            problems.append('UNMAPPED_ORIGINAL_OWNER:' + current_path)
            continue
        protected[current_path] = {
            'historical_path': src,
            'historical_blob': original[src][0],
            'candidate_blob': candidate.get(current_path, (None,))[0],
            'byte_identical': original[src][0] == candidate.get(current_path, (None,))[0],
            'owner_review': 'NOT_ATTESTED'}
    # This is source integrity, NEVER owner approval or behavioral equivalence.
    new = sorted(set(candidate) - set(mapping.values()))
    digest = hashlib.sha256('\n'.join(src + '\t' + original[src][0] for src in governance).encode('utf8')).hexdigest()
    return {'schema': 'ikant-r7-v12-append-only-epoch/v1',
            'source_historic_commit': HISTORY, 'v11_historical_parent': V11_HEAD,
            'candidate_head': git('rev-parse', revision), 'candidate_tree': git('rev-parse', revision + '^{tree}'),
            'snapshot_scope': 'HISTORIC_MAIN_ONLY' if revision != 'HEAD' else 'CURRENT_CHECKOUT',
            'hist_source_files': len(original), 'candidate_files': len(candidate), 'mapped': len(mapping),
            'missing': missing[:12], 'mode_drifts': modes[:12], 'new_paths': new,
            'roots': roots, 'root_files': rootfiles, 'historical_governance_records': len(governance),
            'historical_governance_sha256': digest, 'historical_governance_changed': historic_drift,
            'owner_blobs': protected,
            'checks': {'source_epoch_integrity': not problems, 'historic_governance_unchanged': not historic_drift,
                       'seven_roots_nine_files': roots == sorted(ROOTS) and rootfiles == sorted(ROOT_FILES)},
            'errors': problems, 'status': 'SCOPED_APPEND_ONLY_SOURCE_EPOCH' if not problems else 'BLOCKED',
            'owner_authority': 0, 'historical_receipts_upgraded': False,
            'runtime_equivalence': 'NOT_ATTESTED', 'owner_review': 'NOT_ATTESTED',
            'native_ci_exact_head': 'NOT_RUN', 'product_go': False}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--output')
    ap.add_argument('--require-product', action='store_true')
    ap.add_argument('--historical-main', action='store_true', help='audit exact pinned main historical source, never current-HEAD equivalence')
    a = ap.parse_args()
    try:
        result = audit(revision='e270c6e2cc772f960126eecea9f50501339e3656' if a.historical_main else 'HEAD',
                       worktree=not a.historical_main)
        b = json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + '\n'
        if a.output:
            pathlib.Path(a.output).write_text(b)
        else:
            print(b)
        return 20 if result['errors'] or a.require_product else 0
    except Exception as e:
        print(json.dumps({'status': 'BLOCKED', 'error': str(e), 'product_go': False}), file=sys.stderr)
        return 21


if __name__ == '__main__':
    sys.exit(main())
