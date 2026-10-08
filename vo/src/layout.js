var ROWS = { b: { z: -3.8, aisle: -5.6 }, m: { z: -0.25, aisle: -2.05 }, f: { z: 3.3, aisle: 1.5 } };
var AISLE = { b: -5.6, m: -2.05, f: 1.5 };
const ORDER=[['m',-1.6],['m',1.6],['b',0],['b',-3.15],['b',3.15],['m',-4.7],['m',4.7],['f',0],['b',-6.3],['b',6.3],['f',-3.15],['f',3.15]];
const SEATS=ORDER.map(([r,x],i)=>({i,row:r,x,z:ROWS[r].z,cz:ROWS[r].z-.62,sz:ROWS[r].z-.58,aisle:ROWS[r].aisle}));
const TVP={x:-.94,y:3.04,z:-6.86,w:6.8,h:3.825};
const ELEV={x:8,z:-7,spawn:{x:8,z:-7.95},out:{x:8,z:-6.3}};
var COLX = 8.6;
var BOARD = { x: 9.94, y: 2.7, z: -0.2, w: 10.175, h: 3.7 };
const BELLP={x:6.35,z:-6.2,hx:6.75,hy:1.72};
var pathIn = ($) => [[ELEV.out.x, ELEV.out.z], [8.6, $.aisle], [$.x, $.aisle], [$.x, $.sz]];
var pathOut = ($) => [[$.x, $.aisle], [8.6, $.aisle], [ELEV.out.x, ELEV.out.z], [ELEV.spawn.x, ELEV.spawn.z]];

export {AISLE, BELLP, BOARD, COLX, ELEV, SEATS, TVP, pathIn, pathOut};
