// Four original filled brush silhouettes. No font files or cover pixels are used.
// Broad pressure changes and tapered exits replace uniform tubular strokes.
const glyphs={
 '之':[
  'M43 5 Q52 0 57 8 Q60 13 52 22 L46 20 Q48 12 43 5Z',
  'M12 30 Q30 27 49 22 L76 18 Q87 18 82 29 Q72 40 55 50 L29 68 Q42 64 59 69 Q79 78 97 68 Q92 82 78 86 Q61 85 46 79 Q26 73 7 83 L3 75 Q21 61 42 46 L67 28 Q42 34 15 38 L5 36Z'
 ],
 '见':[
  'M22 12 L34 17 Q30 39 29 65 L20 69 Q23 42 19 24Z',
  'M28 16 Q53 11 77 7 L85 15 Q78 30 76 62 L64 68 Q70 40 70 20 Q47 24 29 25Z',
  'M46 31 Q54 24 59 32 Q55 48 53 58 Q45 81 13 94 L4 91 Q31 75 39 57 Q44 42 46 31Z',
  'M61 53 L68 49 Q65 67 67 82 Q77 87 91 71 L98 58 Q96 88 88 93 Q69 98 59 88 Q53 80 58 67Z'
 ],
 '以':[
  'M18 12 Q28 7 31 18 L28 51 L43 42 Q42 53 31 66 L18 76 Q14 67 18 51 L20 24Z',
  'M43 18 Q57 21 59 31 Q57 40 50 43 Q48 30 40 26Z',
  'M77 3 Q87 3 86 19 Q84 46 73 64 Q61 84 36 95 L28 92 Q52 73 60 56 Q72 33 73 15Z',
  'M69 57 Q79 66 91 80 L100 87 Q89 92 85 89 Q73 77 65 65Z'
 ],
 '我':[
  'M24 21 Q38 13 51 8 L57 15 Q43 25 19 31 L13 29Z',
  'M7 40 Q42 32 78 25 L85 30 Q64 39 10 49 L3 46Z',
  'M34 23 L45 22 Q48 56 42 85 Q39 95 28 94 L16 83 Q31 87 32 78 Q38 48 34 23Z',
  'M8 68 Q31 59 55 44 L56 50 Q37 69 12 79 L4 76Z',
  'M59 2 Q68 0 68 13 Q67 48 77 70 Q82 84 89 82 L99 65 Q100 87 92 95 Q84 101 72 87 Q57 67 55 31 L53 11Z',
  'M82 39 L90 43 Q77 65 50 80 L43 79 Q68 59 76 44Z',
  'M77 8 Q92 10 91 22 L86 28 Q82 16 73 14Z'
 ]
};
export function paintBrush(ctx,glyph,x,y,w,h,colour='#151b18'){
 ctx.save();ctx.translate(x,y);ctx.scale(w/100,h/100);ctx.fillStyle=colour;
 for(const path of glyphs[glyph])ctx.fill(new Path2D(path));
 // Fine irregular paper grain keeps the silhouette solid without a repeated stripe.
 ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=.24;
 let seed=127;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(let i=0;i<2400;i++)ctx.fillRect(rnd()*100,rnd()*100,.06+rnd()*.18,.04+rnd()*.12);
 ctx.restore();
}
