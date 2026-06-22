#!/usr/bin/env python3
"""Start `npm run dev` as a true background daemon.

Double-forks and calls os.setsid() so the dev server lands in its own session,
detached from the parent shell's process group. This prevents it from being
reaped (SIGTERM/SIGKILL to the process group) when the spawning shell session
ends.
"""
import os
import sys

APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = "/tmp/bobcat-dev.log"

# First fork
if os.fork() > 0:
    sys.exit(0)
os.setsid()  # new session -> detach from parent's process group
# Second fork (ensure we're not a session leader, fully daemonized)
if os.fork() > 0:
    sys.exit(0)

os.chdir(APP_DIR)
log = open(LOG, "a", buffering=1)
log.write("\n=== daemon start ===\n")
dev_null = open(os.devnull, "r")
os.dup2(dev_null.fileno(), 0)
os.dup2(log.fileno(), 1)
os.dup2(log.fileno(), 2)

os.execvp("npm", ["npm", "run", "dev"])
