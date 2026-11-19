/* =====================================================================
   三友ワークス — 小さな3D表示の仕組み（WebGL。外部のライブラリは使っていません）
   ・SW.G3.mesh(...) で形を登録し、SW.G3.render(...) で描いて、
     SW.G3.blit(...) でゲーム画面（2Dキャンバス）の好きな場所に貼り付けます。
   ・WebGLが使えない端末では SW.G3.ok が false になり、呼び出し側が絵で代用します。
   ===================================================================== */
(()=>{
'use strict';
const S=SW,cv=document.createElement('canvas');
let gl=null;
try{gl=cv.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true})}catch(e){gl=null}
const G3=S.G3={ok:!!gl,canvas:cv};

/* ---------- 行列（4×4、列優先） ---------- */
const M={
  id:()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
  mul(a,b){const o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o},
  t:(x,y,z)=>[1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1],
  s:(x,y,z)=>[x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1],
  rx(a){const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]},
  ry(a){const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]},
  rz(a){const c=Math.cos(a),s=Math.sin(a);return[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]},
  persp(fov,asp,n,f){const t=1/Math.tan(fov/2);return[t/asp,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0]},
  look(e,c){let zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2];let l=Math.hypot(zx,zy,zz);zx/=l;zy/=l;zz/=l;
    let xx=zz,xy=0,xz=-zx;l=Math.hypot(xx,xz)||1;xx/=l;xz/=l;const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
    return[xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*e[0]+xy*e[1]+xz*e[2]),-(yx*e[0]+yy*e[1]+yz*e[2]),-(zx*e[0]+zy*e[1]+zz*e[2]),1]},
  /* 法線用（左上3×3の逆転置） */
  nrm(m){const a=m[0],b=m[1],c=m[2],d=m[4],e=m[5],f=m[6],g=m[8],h=m[9],i=m[10];
    const A=e*i-f*h,B=f*g-d*i,Cc=d*h-e*g,det=a*A+b*B+c*Cc||1;
    return[A/det,B/det,Cc/det,(c*h-b*i)/det,(a*i-c*g)/det,(b*g-a*h)/det,(b*f-c*e)/det,(c*d-a*f)/det,(a*e-b*d)/det]}
};
M.chain=(...ms)=>ms.reduce((a,b)=>M.mul(a,b));
G3.M=M;
if(!gl){G3.mesh=()=>null;G3.render=()=>false;G3.blit=()=>false;return}

const VS=`attribute vec3 aP;attribute vec3 aN;uniform mat4 uM,uVP;uniform mat3 uNm;varying vec3 vN,vW;
void main(){vec4 w=uM*vec4(aP,1.);vW=w.xyz;vN=uNm*aN;gl_Position=uVP*w;}`;
const FS=`precision mediump float;varying vec3 vN,vW;uniform vec3 uCol,uEye;uniform float uMetal,uEmis,uAlpha;uniform vec4 uClip;
void main(){
  if(dot(vW,uClip.xyz)+uClip.w<0.)discard;
  vec3 N=normalize(vN),V=normalize(uEye-vW);if(dot(N,V)<0.)N=-N;
  vec3 L=normalize(vec3(.45,.8,.55)),L2=normalize(vec3(-.6,.25,.4));
  float d=max(dot(N,L),0.)*.75+max(dot(N,L2),0.)*.25;
  vec3 Hh=normalize(L+V);float sp=pow(max(dot(N,Hh),0.),mix(24.,90.,uMetal));
  vec3 Rr=reflect(-V,N);float sky=smoothstep(-.35,.75,Rr.y);
  vec3 env=mix(vec3(.36,.31,.25),vec3(1.08,1.06,1.02),sky)*(.75+.25*smoothstep(.2,.95,abs(Rr.x)));
  vec3 base=uCol*(.34+.72*d);
  vec3 met=uCol*env*1.12+vec3(sp)*.9;
  vec3 c=mix(base+vec3(sp)*.25,met,uMetal);
  float rim=pow(1.-max(dot(N,V),0.),3.);c+=rim*.10;
  c=mix(c,uCol*1.6+vec3(.25),uEmis);
  gl_FragColor=vec4(c*uAlpha,uAlpha);}`;
function sh(t,src){const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);return s}
const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){G3.ok=false;G3.mesh=()=>null;G3.render=()=>false;G3.blit=()=>false;return}
gl.useProgram(pr);
const U={};['uM','uVP','uNm','uCol','uEye','uMetal','uEmis','uAlpha','uClip'].forEach(n=>U[n]=gl.getUniformLocation(pr,n));
const aP=gl.getAttribLocation(pr,'aP'),aN=gl.getAttribLocation(pr,'aN');
gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);

/* 形を登録する。P=頂点（x,y,z…）、N=法線、I=三角形の番号 */
G3.mesh=(P,N,I)=>{const m={n:I.length,P,N,I};m.vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,m.vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(P),gl.STATIC_DRAW);
  m.nb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,m.nb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(N),gl.STATIC_DRAW);
  m.ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(I),gl.STATIC_DRAW);return m};

/* list=[{m,M,col:[r,g,b],metal,emis,alpha,clip:[a,b,c,d]}]  cam={yaw,pitch,dist,target:[x,y,z],fov} */
G3.render=(list,cam,pw,ph)=>{
  pw=Math.max(16,Math.round(pw));ph=Math.max(16,Math.round(ph));
  if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph}
  gl.viewport(0,0,pw,ph);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const tg=cam.target||[0,0,0],d=cam.dist||6,cy=Math.cos(cam.pitch||0),sy=Math.sin(cam.pitch||0);
  const eye=[tg[0]+Math.sin(cam.yaw||0)*cy*d,tg[1]+sy*d,tg[2]+Math.cos(cam.yaw||0)*cy*d];
  const VP=M.mul(M.persp(cam.fov||.55,pw/ph,.5,60),M.look(eye,tg));
  gl.uniformMatrix4fv(U.uVP,false,new Float32Array(VP));gl.uniform3fv(U.uEye,eye);
  for(const o of list){if(!o||!o.m)continue;
    gl.uniformMatrix4fv(U.uM,false,new Float32Array(o.M));gl.uniformMatrix3fv(U.uNm,false,new Float32Array(M.nrm(o.M)));
    gl.uniform3fv(U.uCol,o.col);gl.uniform1f(U.uMetal,o.metal||0);gl.uniform1f(U.uEmis,o.emis||0);gl.uniform1f(U.uAlpha,o.alpha==null?1:o.alpha);
    gl.uniform4fv(U.uClip,o.clip||[0,0,0,1]);
    gl.bindBuffer(gl.ARRAY_BUFFER,o.m.vb);gl.enableVertexAttribArray(aP);gl.vertexAttribPointer(aP,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,o.m.nb);gl.enableVertexAttribArray(aN);gl.vertexAttribPointer(aN,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.m.ib);gl.drawElements(gl.TRIANGLES,o.m.n,gl.UNSIGNED_SHORT,0)}
  return true};
/* 描いた3Dを、2Dのゲーム画面の (x,y,w,h) に貼る */
G3.blit=(C,x,y,w,h)=>{try{C.drawImage(cv,x,y,w,h);return true}catch(e){return false}};
})();
