# helpers for the globe login (GXU) in regression scripts. Never prints access codes.
def to_menu(pg,timeout=120000):
    pg.wait_for_function("typeof GXU!=='undefined'&&GXU.state()==='menu'",timeout=timeout)
def login(pg,idx,timeout=120000):
    """pick operator number idx (0-based) and authenticate using the in-page code map."""
    to_menu(pg,timeout)
    pg.evaluate("pickProfile(GXU.U.names[%d])"%idx)
    pg.wait_for_function("GXU.state()==='land'",timeout=timeout)
    pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('lgi').value=(PWD[LG]||'x');doLogin()")
    pg.wait_for_function("ONLINE===1",timeout=timeout)
    pg.wait_for_timeout(600)
