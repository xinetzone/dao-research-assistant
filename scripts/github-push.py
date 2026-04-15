#!/usr/bin/env python3
"""Push all project files to GitHub via Edge Function."""
import os, sys, base64, json
try: import requests
except ImportError: import subprocess as sp; sp.run([sys.executable,"-m","pip","install","requests","-q"]); import requests
U="https://spb-t4nnhrh7ch7j2940.supabase.opentrust.net"
A="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5uaHJoN2NoN2oyOTQwIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzYwNzQ1MjMsImV4cCI6MjA5MTY1MDUyM30.5GFdUIA3rHOUoCI99ocBzBxDZjjQxOHRV-T6CKiHzCQ"
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP={".git",".vite","node_modules","__pycache__",".next","dist"}
files=[]
for dirpath,dirs,fnames in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP]
    for fn in fnames:
        fp=os.path.join(dirpath,fn); rel=os.path.relpath(fp,ROOT)
        if any(s in rel for s in SKIP): continue
        try:
            with open(fp,"rb") as fh: files.append({"path":rel,"content":base64.b64encode(fh.read()).decode(),"encoding":"base64"})
        except: pass
msg=" ".join(sys.argv[1:]) if len(sys.argv)>1 else "chore: sync workspace files"
print(f"Pushing {len(files)} files: {msg[:60]}",flush=True)
resp=requests.post(f"{U}/functions/v1/github-push",
    headers={"Authorization":f"Bearer {A}","Content-Type":"application/json"},
    json={"owner":"xinetzone","repo":"dao-yan","branch":"main","message":msg,"files":files},timeout=600)
d=resp.json()
print(f"HTTP {resp.status_code} commitSha={d.get('commitSha','')[:12]} files={d.get('filesCount',0)}")
