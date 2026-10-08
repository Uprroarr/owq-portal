# OWQ portal: source backup

This branch holds the working source for the portal's add-ons. GitHub Pages serves only `main` (live at the root, preview at `/preview/`), so nothing here is served or affects the site.

Never commit the base portal HTML (`vNNN-final.html`; it has the access codes and the team's records), `web/private/`, data exports, or anything with the team's codes or emails. `tools/` holds only helpers that passed the code and email scan.

## Layout
- `vo/src/`: the 3D Sales Floor library (three.js r169). `vo/three/` holds the three.js build it imports.
- `agents/<feature>/`: patch scripts that add features to the portal HTML (JS, CSS and Python patchers).
- `web/`: website build (`build_web.py`), cloud adapter (`web/src/owqcloud.js`), database rules and Playwright tests (`web/test/`).
- `recovery/`: notes and tools used to rebuild sources from a deployed build.

## Build
1. Library: `cd vo && mkdir -p node_modules && ln -sfn ../three node_modules/three && bun build src/iife.js --minify --format=iife --outfile=dist/vo.js`
2. Portal: patch scripts swap the library into the base HTML between `/*VO3lib*/` and `</script>`, and add each feature's block (`/*XXXstart*/ ... /*XXXend*/`).
3. Site: `cd web && OWQ_BASE=../vNNN-final.html OWQ_SITE=site_prod python3 build_web.py` (add `OWQ_TEST=1` and `OWQ_SITE=test/site_x` for the fake-database test site).

## If the workspace is reset
The deployed builds on `main` hold the full compiled code. `index.html` is live and `preview/index.html` is the preview. Each feature block is readable there. The 3D library is minified, but `bun build` is deterministic, so a rebuilt source can be checked byte for byte against the deployed bundle.
