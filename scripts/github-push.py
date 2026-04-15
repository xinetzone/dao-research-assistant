#!/usr/bin/env python3
"""Push all git-tracked files to GitHub. Usage: python3 scripts/github-push.py [message]"""
import os, sys, subprocess, base64, json
try: import requests
except ImportError:
    import subprocess as sp; sp.run([sys.executable,"-m","pip","install","requests","-q"]); import requests

U = "https://spb-t4nnhrh7ch7j2940.supabase.opentrust.net"
A = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5uaHJoN2NoN2oyOTQwIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzYwNzQ1MjMsImV4cCI6MjA5MTY1MDUyM30.5GFdUIA3rHOUoCI99ocBzBxDZjjQxOHRV-T6CKiHzCQ"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
r = subprocess.run(["git","ls-files","-z"],capture_output=True,cwd=ROOT)
fl = [f for f in r.stdout.decode("utf-8").split("\x00") if f]
files = []
for f in fl:
    fp = os.path.join(ROOT,f)
    if not os.path.isfile(fp): continue
    with open(fp,"rb") as fh: files.append({"path":f,"content":base64.b64encode(fh.read()).decode(),"encoding":"base64"})
msg = " ".join(sys.argv[1:]) if len(sys.argv)>1 else subprocess.run(["git","log","-1","--pretty=%s"],capture_output=True,cwd=ROOT).stdout.decode().strip()
print(f"Pushing {len(files)} files: {msg[:60]}")
resp = requests.post(f"{U}/functions/v1/github-push",
    headers={"Authorization":f"Bearer {A}","Content-Type":"application/json"},
    json={"owner":"xinetzone","repo":"dao-yan","branch":"main","message":msg,"files":files},timeout=300)
d = resp.json()
print(f"HTTP {resp.status_code} — files={d.get('filesCount',0)}" if resp.status_code==200 else json.dumps(d)[:300])
