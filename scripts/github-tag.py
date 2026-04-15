#!/usr/bin/env python3
"""Create a git tag on GitHub. Usage: python3 scripts/github-tag.py v1.0.0 [message]"""
import os, sys, json
try: import requests
except ImportError:
    import subprocess as sp; sp.run([sys.executable,"-m","pip","install","requests","-q"]); import requests

U = "https://spb-t4nnhrh7ch7j2940.supabase.opentrust.net"
A = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5uaHJoN2NoN2oyOTQwIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzYwNzQ1MjMsImV4cCI6MjA5MTY1MDUyM30.5GFdUIA3rHOUoCI99ocBzBxDZjjQxOHRV-T6CKiHzCQ"
if len(sys.argv) < 2:
    print("Usage: python3 scripts/github-tag.py <tag> [message]"); sys.exit(1)
tag = sys.argv[1]
message = " ".join(sys.argv[2:]) if len(sys.argv)>2 else tag
resp = requests.post(f"{U}/functions/v1/github-tag",
    headers={"Authorization":f"Bearer {A}","Content-Type":"application/json"},
    json={"owner":"xinetzone","repo":"dao-yan","tag":tag,"message":message},timeout=60)
d = resp.json()
print(f"HTTP {resp.status_code} — tag={d.get('tag','')} sha={d.get('sha','')[:12]}" if resp.status_code==200 else json.dumps(d)[:300])
