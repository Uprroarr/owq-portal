from playwright.sync_api import sync_playwright
JS="""async()=>{const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});pc.createDataChannel('t');const c=[];pc.onicecandidate=e=>{if(e.candidate)c.push(e.candidate.candidate)};await pc.setLocalDescription(await pc.createOffer());await new Promise(r=>setTimeout(r,3000));return {st:pc.iceGatheringState,c}}"""
with sync_playwright() as p:
    for fl in ([],['--force-webrtc-ip-handling-policy=disable_non_proxied_udp'],['--force-webrtc-ip-handling-policy=default_public_interface_only'],['--webrtc-ip-handling-policy=disable_non_proxied_udp']):
        b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium',args=['--no-sandbox','--no-proxy-server']+fl)
        pg=b.new_page();pg.goto('about:blank')
        print(fl, pg.evaluate(JS));b.close()
