#!/bin/bash
# build the 3D library, patch it into the portal (v107) and make the fake-database test site
set -e
SP=${SP:-/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad}
cd /home/claude/owq-src/vo && /root/.bun/bin/bun build src/iife.js --minify --format=iife --outfile=dist/vo.js 2>&1 | grep -E "error|vo.js" || true
cd /home/claude/owq-src && OWQ_BASE=$SP/v106-final.html OWQ_OUT=$SP/v107-final.html python3 agents/world/patch_world.py
cd $SP/web && OWQ_BASE=$SP/v107-final.html OWQ_SITE=${SITE:-test/site_w} OWQ_TEST=${TEST-1} python3 build_web.py | sed 's/codes [0-9]*/codes (hidden)/'
