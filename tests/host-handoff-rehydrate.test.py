import importlib.util
import pathlib
import shutil
import subprocess
import tempfile
import unittest
import zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
S=importlib.util.spec_from_file_location('rehydrate',ROOT/'scripts/host-rehydrate-source-zip.py')
M=importlib.util.module_from_spec(S);S.loader.exec_module(M)
def git(*a):
 return subprocess.check_output(['git',*a],cwd=ROOT).decode().strip()
class Offline(unittest.TestCase):
 def setUp(self):
  self.tmp=pathlib.Path(tempfile.mkdtemp(prefix='ikant-restart-'))
  self.head=git('rev-parse','HEAD');self.tree=git('rev-parse','HEAD^{tree}')
  self.raw=self.tmp/'original.raw'
  self.raw.write_bytes(subprocess.check_output(['git','cat-file','commit',self.head],cwd=ROOT))
  archive=self.tmp/'archive.zip'
  subprocess.run(['git','archive','--format=zip','--prefix=x/','HEAD','-o',str(archive)],cwd=ROOT,check=True)
  self.archive=self.tmp/'source.zip'
  with zipfile.ZipFile(archive) as inp,zipfile.ZipFile(self.archive,'w') as out:
   for z in inp.infolist():
    body=inp.read(z);z.filename=z.filename.replace('x/','iKant_EDU-'+self.head+'/',1)
    out.writestr(z,body)
  self.out=self.tmp/'checkout'
 def tearDown(self):shutil.rmtree(self.tmp,ignore_errors=True)
 def run_case(self,archive=None,raw=None,head=None,tree=None):
  return M.prepare(archive or self.archive,raw or self.raw,self.out,head or self.head,tree or self.tree)
 def test_source_zip_roundtrip(self):
  r=self.run_case()
  self.assertEqual(r['source_head'],self.head)
  self.assertEqual(subprocess.check_output(['git','log','-1','--format=%H'],cwd=self.out).decode().strip(),self.head)
  self.assertFalse(r['native_active'])
 def test_wrong_commit_rejected(self):
  bad=self.tmp/'bad.raw';bad.write_bytes(self.raw.read_bytes()+b'changed')
  with self.assertRaisesRegex(ValueError,'COMMIT_OBJECT_MISMATCH'):self.run_case(raw=bad)
 def test_mutated_source_rejected(self):
  with zipfile.ZipFile(self.archive) as z:members=[(e,z.read(e)) for e in z.infolist()]
  evil=self.tmp/'evil.zip'
  with zipfile.ZipFile(evil,'w') as z:
   for e,b in members:
    if e.filename.endswith('README.md'):b+=b'mutated'
    z.writestr(e,b)
  with self.assertRaisesRegex(ValueError,'SOURCE_TREE_MISMATCH'):self.run_case(archive=evil)
 def test_historic_le_source_prefix_is_refused(self):
  old=self.tmp/'legacy-le.zip'
  with zipfile.ZipFile(self.archive) as inp,zipfile.ZipFile(old,'w') as out:
   for entry in inp.infolist():
    body=inp.read(entry)
    entry.filename=entry.filename.replace('iKant_EDU-'+self.head+'/', 'iKant_LE-'+self.head+'/', 1)
    out.writestr(entry,body)
  with self.assertRaisesRegex(ValueError,'ARCHIVE_PREFIX'):self.run_case(archive=old)
  self.assertFalse(self.out.exists())
 def test_no_blind_overwrite(self):
  self.out.mkdir()
  with self.assertRaisesRegex(ValueError,'OUTPUT_EXISTS_OR_PARENT_MISSING'):self.run_case()
if __name__=='__main__':unittest.main()
