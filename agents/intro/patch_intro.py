#!/usr/bin/env python3
"""intro deliverable (uniform interface): splices the gx/ sources (engine, UI, css, textures) into the base portal.
   env OWQ_BASE (default $SP/v75-final.html), OWQ_OUT (default $SP/agents/intro/out/portal.html). Deterministic / idempotent.
   It is a block splice (see INTEGRATION.md), it does not touch base lines outside the GX blocks."""
import os,runpy
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
os.environ.setdefault('OWQ_BASE',SP+'/v75-final.html')
os.environ.setdefault('OWQ_OUT',SP+'/agents/intro/out/portal.html')
os.environ.setdefault('GX_DIR',SP+'/agents/intro/gx')
runpy.run_path(SP+'/agents/intro/splice.py',run_name='__main__')
