#!/bin/bash
# Full rebuild: engine -> text placement -> custom scenes. Then lint and render.
set -e
HF=/root/.claude/skills/synced/0ee93b22-d2b5-4867-8568-8446e5ee91e7_1d8b3380-655b-4198-a80b-bc28bb2ca788/video-editor/hyperframes
node "$HF/engine.mjs"
./place-text.sh
node custom.mjs
npx -y hyperframes lint .
