#!/bin/bash
SP=/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad; D=$SP/agents/space
GX_DIR=$D/gx OWQ_BASE=$SP/v77-final.html OWQ_OUT=$D/out/portal.html python3 $SP/agents/intro/splice.py && python3 $D/patch_space.py
