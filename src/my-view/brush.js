// Original pressure-varying brush paths; no external fonts or reference pixels.
const glyphs={
 '之':[[8,[[48,10],[54,7],[58,13]]],[7,[[17,34],[47,27],[73,21],[80,27],[62,44],[37,66],[19,80]]],[11,[[19,80],[37,74],[58,79],[78,86],[95,79]]]],
 '见':[[7,[[25,19],[27,39],[26,62]]],[7,[[25,19],[49,15],[76,13],[73,38],[71,62]]],[7,[[51,31],[51,50],[44,66],[27,85],[13,91]]],[9,[[61,55],[59,75],[61,87],[76,89],[90,82],[94,66]]]],
 '以':[[8,[[28,11],[27,34],[25,56],[39,50]]],[8,[[46,22],[52,25],[56,34]]],[9,[[76,8],[75,31],[64,59],[43,83],[30,94]]],[9,[[64,56],[77,77],[91,89]]]],
 '我':[[7,[[20,26],[41,20],[57,13]]],[8,[[9,44],[41,37],[75,30]]],[9,[[37,21],[40,46],[39,73],[34,88],[24,83]]],[7,[[14,74],[34,63],[53,51]]],[10,[[57,8],[60,33],[64,60],[77,87],[88,84],[96,66]]],[6,[[84,44],[74,57],[62,69],[52,80]]],[7,[[76,13],[83,19],[88,27]]]]
};
function curve(points,t){const s=t*(points.length-1),i=Math.min(points.length-2,Math.floor(s)),u=s-i,a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];return [0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*u+(2*a[k]-5*b[k]+4*c[k]-d[k])*u*u+(-a[k]+3*b[k]-3*c[k]+d[k])*u*u*u));}
export function paintBrush(ctx,glyph,x,y,w,h,colour='#151c19',seed=1){
 ctx.save();ctx.translate(x,y);ctx.scale(w/100,h/100);ctx.fillStyle=colour;
 for(const [s,[width,points]] of glyphs[glyph].entries()){
  const left=[],right=[];
  for(let j=0;j<=90;j++){const t=j/90,p=curve(points,t),a=curve(points,Math.max(0,t-.003)),b=curve(points,Math.min(1,t+.003)),l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,n=[-(b[1]-a[1])/l,(b[0]-a[0])/l],pressure=(.31+.65*Math.sin(Math.PI*(t*.82+.06))**.65)*(1+.1*Math.sin(j*2.3+s*7+seed)),r=width*pressure*.5;left.push([p[0]+n[0]*r,p[1]+n[1]*r]);right.push([p[0]-n[0]*r,p[1]-n[1]*r]);}
  ctx.beginPath();[...left,...right.reverse()].forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='#000';ctx.lineWidth=.10;
  for(let j=0;j<11;j++){ctx.beginPath();for(let k=0;k<13;k++){const t=.1+k*.062,p=curve(points,t),off=(j-5)*width*.053,q=[p[0]+off,p[1]+.23*Math.sin(k*1.7+j)];k?ctx.lineTo(...q):ctx.moveTo(...q);}ctx.stroke();}ctx.restore();
 }ctx.restore();
}
