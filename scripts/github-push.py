#!/usr/bin/env python3
"""
Push all git-tracked files to GitHub via the github-push Edge Function.
Usage: python3 scripts/github-push.py [commit-message]
"""
import os, sys, subprocess, base64, json

try:
    import requests
except ImportError:
    import subprocess as sp
    sp.run([sys.executable, "-m", "pip", "install", "requests", "-q"])
    import requests

SUPABASE_URL = "https://spb-t4nnhrh7ch7j2940.supabase.opentrust.net"
ANON_KEY    = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5uaHJoN2NoN2oyOTQwIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzYwNzQ1MjMsImV4cCI6MjA5MTY1MDUyM30.5GFdUIA3rHOUoCI99ocBzBxDZjjQxOHRV-T6CKiHzCQ"
REPO_OWNER  = "xinetzone"
REPO_NAME   = "dao-yan"
BRANCH      = "main"
ROOT        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_last_commit_msg():
    r = subprocess.run(["git", "log", "-1", "--pretty=%s"], capture_output=True, cwd=ROOT)
    return r.stdout.decode().strip()

def collect_files():
    r = subprocess.run(["git", "ls-files", "-z"], capture_output=True, cwd=ROOT)
    file_list = [f for f in r.stdout.decode("utf-8").split("\x00") if f]
    files = []
    for f in file_list:
        fp = os.path.join(ROOT, f)
        if not os.path.isfile(fp):
            continue
        with open(fp, "rb") as fh:
            files.append({
                "path": f,
                "content": base64.b64encode(fh.read()).decode(),
                "encoding": "base64"
            })
    return files

def push(message=None):
    files = collect_files()
    message = message or get_last_commit_msg() or "chore: sync workspace"
    print(f"Pushing {len(files)} files: {message[:60]}", flush=True)

    resp = requests.post(
        f"{SUPABASE_URL}/functions/v1/github-push",
        headers={"Authorization": f"Bearer {ANON_KEY}", "Content-Type": "application/json"},
        json={"owner": REPO_OWNER, "repo": REPO_NAME, "branch": BRANCH,
              "message": message, "files": files},
        timeout=300
    )
    d = resp.json()
    if resp.status_code == 200:
        print(f"✅ Pushed! files={d.get('filesCount', 0)}", flush=True)
    else:
        print(f"❌ Error: {json.dumps(d, ensure_ascii=False)[:300]}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    msg = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else None
    push(msg)
