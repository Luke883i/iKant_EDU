import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile
import hashlib
import json
SCRIPT=Path(__file__).resolve().parents[1]/'scripts/project-edu-zip-tree.py'
spec=importlib.util.spec_from_file_location('ziproot',SCRIPT)
root=importlib.util.module_from_spec(spec);spec.loader.exec_module(root)
HEAD='a'*40
FILES={'README.md':b'hello\n','host/example.mjs':b'export {}\n','TERMS.md':b'terms\n'}
def gitsha(kind,data):return hashlib.sha1(kind.encode()+b' '+str(len(data)).encode()+b'\0'+data).hexdigest()
def expected():
 body=lambda p: b'100644 '+p.split('/')[-1].encode()+b'\0'+bytes.fromhex(gitsha('blob',FILES[p]))
 host=gitsha('tree',body('host/example.mjs'))
 items=[body('README.md'),body('TERMS.md'),b'40000 host\0'+bytes.fromhex(host)]
 return gitsha('tree',b''.join(items))
class Tests(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory();self.z=Path(self.t.name)/'source.zip'
  with zipfile.ZipFile(self.z,'w',zipfile.ZIP_DEFLATED) as f:
   for p,b in FILES.items():f.writestr('iKant_EDU-'+HEAD+'/'+p,b)
 def tearDown(self):self.t.cleanup()
 def test_original_tree_root(self):
  x=root.derive(self.z,HEAD,expected());self.assertEqual(x['source_tree'],expected())
  self.assertFalse(x['truncated']);self.assertEqual(len(x['tree']),4)
 def test_root_tamper_denied(self):
  with self.assertRaisesRegex(ValueError,'ZIP_ROOT'):root.derive(self.z,HEAD,'f'*40)
 def test_wrong_head_denied(self):
  with self.assertRaisesRegex(ValueError,'PREFIX'):root.derive(self.z,'b'*40,expected())
 def test_traversal_denied(self):
  with zipfile.ZipFile(self.z,'a') as f:f.writestr('iKant_EDU-'+HEAD+'/../escape',b'x')
  with self.assertRaisesRegex(ValueError,'UNSAFE'):root.derive(self.z,HEAD,expected())
if __name__=='__main__':unittest.main()
