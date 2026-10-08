# Rebuilding the 3D library source from a deployed bundle (done Oct 8, 2026 for v105)

1. Pull the bundle out of the deployed HTML: the text between `/*VO3lib*/` and `</script>`.
2. Pretty-print it: `bun build min.js --format=esm --outfile=pretty.js`.
3. Make name-keeping reference builds with `--minify-syntax --minify-whitespace` (no identifier minify): one of all of three.js plus the add-ons, and one of the last known source.
4. `units.js` fingerprints every top-level unit (identifiers numbered by binding, property names kept). `align.py` lines the units up with difflib and votes on names.
5. `mknames.py` assigns a module and name to every unit, with hand-picked names for new code. `gen.js` writes ES modules: `THREE.X` for three.js, named imports between modules, and the old source text wherever code is unchanged.
6. Check: rebuild with `bun build --minify`, pretty-print, run `units.js` again and compare the fingerprints in order. For v105 every unit matched except one with relabelled loop labels inside three.js.
