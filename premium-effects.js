/* Coin Rush: lightweight cinematic arcade effects, tuned for mobile. */
(function(){
  'use strict';
  const stage=document.querySelector('.stage');
  const game=document.getElementById('game');
  if(!stage||!game)return;
  const style=document.createElement('style');
  style.textContent=`
    .stage{isolation:isolate;position:relative;overflow:hidden;background:#050817;box-shadow:0 0 0 1px #a78bfa,0 0 28px #7c3aed66,0 0 65px #00d9ff22,0 18px 55px #000b}
    #game{position:relative;z-index:0;filter:saturate(1.18) contrast(1.06);animation:crCanvasGlow 6s ease-in-out infinite;will-change:filter}
    .cr-vfx{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;mix-blend-mode:screen}
    .overlay{z-index:4}
    .rewardoffer{z-index:8}
    .stage:after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(115deg,transparent 0%,#9deaff08 42%,#ffffff0d 50%,transparent 59%),radial-gradient(ellipse at 50% 0%,#a855f718,transparent 60%);opacity:.85}
    .stat,.panel,.itemrow,.controls button,.tab{backdrop-filter:blur(8px)}
    .itemicon{position:relative;overflow:hidden}
    .itemicon:after{content:"";position:absolute;inset:-60%;background:linear-gradient(115deg,transparent 40%,#ffffff22 50%,transparent 60%);transform:translateX(-70%);animation:crShipSheen 5s ease-in-out infinite}
    #levelbar{box-shadow:inset 0 1px #ffffff12,0 0 18px #8b5cf633}
    @keyframes crCanvasGlow{0%,100%{filter:saturate(1.14) contrast(1.04)}50%{filter:saturate(1.28) contrast(1.08)}}
    @keyframes crShipSheen{0%,70%,100%{transform:translateX(-70%)}85%{transform:translateX(70%)}}
    @media(prefers-reduced-motion:reduce){#game,.itemicon:after{animation:none}}
  `;
  document.head.appendChild(style);

  /* Cinematic realism pass: layered planetary atmosphere, vignette, filmic lighting. */
  style.textContent += `
    .stage{background:#02050d!important;border-color:#9bb6df!important;box-shadow:0 0 0 1px #d5e7ff25,0 0 38px #2c6db455,0 22px 60px #000d!important}
    body{background:radial-gradient(ellipse at 50% -15%,#263b61 0%,#0a1223 42%,#03060d 100%)!important}
    .logo{text-shadow:0 0 16px #8ecbff55!important}
    .stat{background:linear-gradient(145deg,#17263bdc,#070d18ee)!important;border-color:#6f91b755!important}
    .stat strong{color:#d6e8ff!important;text-shadow:0 0 12px #76baff44!important}
    .btn{background:linear-gradient(135deg,#e5f4ff,#75bfff 52%,#326fbd)!important;color:#06101e!important;box-shadow:0 0 24px #69baff40!important}
    .controls button,.tab{background:linear-gradient(145deg,#182a40,#080f1b)!important;border-color:#54789c!important}
    #left,#right{background:linear-gradient(145deg,#294968,#10253c)!important;border-color:#b9dcff!important;color:#eff8ff!important;box-shadow:0 5px 0 #091522,0 0 20px #69baff20!important}
    .panel{background:linear-gradient(145deg,#14243a,#080f1b)!important;border-color:#476583!important}
    .itemicon{background:radial-gradient(circle at 30% 25%,#45627c,#101a2a)!important;border-color:#779bb8!important}
    .stage:before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(ellipse at 50% 48%,transparent 38%,#02050d25 72%,#02050d9c 100%),linear-gradient(180deg,#b8e2ff0a,transparent 25%,transparent 72%,#02050d55)}
    .cr-vfx{mix-blend-mode:screen;opacity:.82}
  `;
  const fx=document.createElement('canvas');
  fx.className='cr-vfx';fx.setAttribute('aria-hidden','true');stage.appendChild(fx);
  const c=fx.getContext('2d',{alpha:true});
  let w=420,h=600,dpr=1,raf=0,last=0,stars=[],meteors=[],bursts=[];
  function resize(){
    const r=game.getBoundingClientRect();if(!r.width||!r.height)return;
    dpr=Math.min(window.devicePixelRatio||1,1.5);w=r.width;h=r.height;
    fx.width=Math.round(w*dpr);fx.height=Math.round(h*dpr);fx.style.width=w+'px';fx.style.height=h+'px';
    c.setTransform(dpr,0,0,dpr,0,0);
    stars=Array.from({length:Math.max(38,Math.min(85,Math.round(w/4)))},()=>({x:Math.random()*w,y:Math.random()*h,r:.35+Math.random()*1.25,a:.12+Math.random()*.4,s:.15+Math.random()*.7,phase:Math.random()*6}));
  }
  function meteor(){if(meteors.length<3&&Math.random()<.018)meteors.push({x:Math.random()*w*.95,y:-10,len:18+Math.random()*48,v:2+Math.random()*3,a:.45+Math.random()*.45});}
  function burst(){if(bursts.length<90)for(let i=0;i<14;i++){let a=Math.random()*Math.PI*2,s=.6+Math.random()*2.8;bursts.push({x:w*(.2+Math.random()*.6),y:h*(.2+Math.random()*.6),vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,r:1+Math.random()*2});}}
  function draw(t){
    raf=requestAnimationFrame(draw);if(t-last<32)return;last=t;
    c.clearRect(0,0,w,h);
    for(const s of stars){s.y+=s.s;if(s.y>h)s.y=0;s.phase+=.025;c.globalAlpha=s.a*(.72+.28*Math.sin(s.phase));c.fillStyle='#c8f7ff';c.beginPath();c.arc(s.x,s.y,s.r,0,Math.PI*2);c.fill();}
    c.globalAlpha=1;meteor();
    for(let i=meteors.length-1;i>=0;i--){const m=meteors[i];m.x-=m.v*.7;m.y+=m.v*1.5;m.a-=.006;c.globalAlpha=Math.max(0,m.a);let g=c.createLinearGradient(m.x,m.y-m.len,m.x,m.y);g.addColorStop(0,'#8be9ff00');g.addColorStop(1,'#c8f7ff');c.strokeStyle=g;c.lineWidth=1.4;c.beginPath();c.moveTo(m.x,m.y-m.len);c.lineTo(m.x,m.y);c.stroke();if(m.y>h+20||m.a<=0)meteors.splice(i,1);}
    for(let i=bursts.length-1;i>=0;i--){const p=bursts[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.018;p.life-=.025;c.globalAlpha=Math.max(0,p.life);c.fillStyle=i%3?'#ffdf70':'#a7f7ff';c.shadowBlur=8;c.shadowColor=c.fillStyle;c.beginPath();c.arc(p.x,p.y,p.r,0,Math.PI*2);c.fill();if(p.life<=0)bursts.splice(i,1);}
    c.globalAlpha=1;c.shadowBlur=0;
  }
  const score=document.getElementById('score');let previous=score?score.textContent:'';
  if(score){new MutationObserver(()=>{if(score.textContent!==previous){previous=score.textContent;burst();}}).observe(score,{childList:true,subtree:true,characterData:true});}
  const start=document.getElementById('start');if(start)start.addEventListener('click',()=>{bursts.length=0;});
  window.addEventListener('resize',resize,{passive:true});resize();requestAnimationFrame(draw);
})();