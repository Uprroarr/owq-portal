import json
h=open('/mnt/user-data/outputs/owq-command-station-v2.html').read()
js=[x.split('</script>')[0] for x in h.split('<script>')[1:] if 'const views=' in x.split('</script>')[0]][0]
hdr=open('gen_hdr.js').read();test=open('tchat_test.js').read()
open('tchat.js','w').write("const vm=require('vm');vm.runInThisContext("+json.dumps(hdr+js+test)+");")
