import React from 'react';
import {AbsoluteFill,Img,staticFile,useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {DURATION,LOGOS,SECTIONS,StudioProps,Person,PersonGroup,thousands} from '../data/project';

const GOLD='#DFC48A';
const MINT='#6FDEBA';
const WHITE='#F8FBFF';
const m=(x:number,min=0,max=1)=>Math.min(max,Math.max(min,x));
const ease=(x:number)=>{const a=m(x);return a*a*(3-2*a)};
const stagger=(t:number,delay:number,len=.9)=>ease((t-delay)/len);
const opacityAt=(t:number,start:number,end:number)=>ease((t-start+.65)/1.3)*(1-ease((t-end+.65)/1.3));
const STARS=Array.from({length:92},(_,i)=>({x:((i*241+97)%1913),y:((i*367+23)%1071),r:(i%5===0?2.7:1.15),speed:(i%7+1)*.38}));
const S=(str:string)=>staticFile(str.replace(/^\//,''));


// Satu partikel memiliki ID tetap. Posisi targetnya berubah secara kontinu
// pada batas antar-segmen sehingga bentuk benar-benar morph, bukan hard-cut.
const MORPH_COUNT=180;
const TAU=Math.PI*2;
type MorphKind=typeof SECTIONS[number]['id'];
const fract=(n:number)=>n-Math.floor(n);
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const morphPoint=(kind:MorphKind,i:number,t:number):[number,number]=>{
  const f=i/MORPH_COUNT,theta=f*TAU;
  if(kind==='opening'){
    const angle=f*TAU*4.7+t*.16;
    return [960+Math.cos(angle)*(85+650*f),540+Math.sin(angle)*(70+340*f)];
  }
  if(kind==='university'){
    const ring=i%4, u=Math.floor(i/4)/(MORPH_COUNT/4),a=u*TAU+t*.085*(ring%2?1:-1);
    return [960+Math.cos(a)*(260+ring*145),530+Math.sin(a)*(135+ring*73)];
  }
  if(kind==='fitk'){
    // Tiga helai daun berpola radial, tersusun dari dua sisi yang saling melengkapi.
    const leaf=i%3,u=Math.floor(i/3)/(MORPH_COUNT/3);
    const side=u<.5?1:-1,progress=u<.5?u*2:(u-.5)*2;
    const a=-Math.PI/2+leaf*TAU/3;
    const radial=150+390*progress;
    const width=Math.sin(progress*Math.PI)*185*side;
    return [960+Math.cos(a)*radial-Math.sin(a)*width,540+Math.sin(a)*radial+Math.cos(a)*width];
  }
  if(kind==='program'){
    const u=Math.floor(i/2)/(MORPH_COUNT/2),strand=i%2;
    return [210+1500*u,540+185*Math.sin(u*TAU*3+t*.14+strand*Math.PI)];
  }
  if(kind==='teachers'){
    const ring=i%4,u=Math.floor(i/4)/(MORPH_COUNT/4),a=u*TAU+t*.12*(ring%2?-1:1);
    return [300+440*ring+Math.cos(a)*150,545+Math.sin(a)*150];
  }
  if(kind==='statistics'){
    const bar=i%12,vertical=Math.floor(i/12)/14;
    const heights=[210,430,300,570,390,500,330,650,400,540,265,470];
    return [290+bar*123+Math.sin(t*.6+i)*5,880-heights[bar]*vertical];
  }
  // Penutup: mandala sepuluh kelopak membentuk satu bintang di tengah.
  const a=theta+t*.06;
  const radius=340+150*Math.cos(a*10);
  return [960+Math.cos(a)*radius,530+Math.sin(a)*radius*.72];
};
const hexColor=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const mixedColor=(from:string,to:string,k:number)=>{
  const a=hexColor(from),b=hexColor(to);
  return `rgb(${a.map((n,i)=>Math.round(mix(n,b[i],k))).join(',')})`;
};
function MorphParticles({t}:{t:number}){
  let current=0;
  for(let i=0;i<SECTIONS.length;i++) if(t>=SECTIONS[i].start)current=i;
  let from=current,to=current,blend=0;
  const fadeSeconds=1.8;
  if(current>0 && t<SECTIONS[current].start+fadeSeconds){
    from=current-1;to=current;
    blend=ease((t-(SECTIONS[current].start-fadeSeconds))/(2*fadeSeconds));
  }else if(current<SECTIONS.length-1 && t>SECTIONS[current+1].start-fadeSeconds){
    from=current;to=current+1;
    blend=ease((t-(SECTIONS[current+1].start-fadeSeconds))/(2*fadeSeconds));
  }
  const source=SECTIONS[from],target=SECTIONS[to];
  const color=mixedColor(source.color,target.color,blend);
  const positions=Array.from({length:MORPH_COUNT},(_,i)=>{
    const [x,y]=morphPoint(source.id,i,t);
    const [nx,ny]=morphPoint(target.id,i,t);
    const drift=fract(Math.sin((i+1)*72.294)*43758.52);
    const depth=.38+drift*.62;
    return {
      x:mix(x,nx,blend)+Math.sin(t*.45+i*1.9)*10*depth,
      y:mix(y,ny,blend)+Math.cos(t*.37+i*1.3)*8*depth,
      r:(i%9===0?3.8:1.4+(i%4)*.45)*depth,
      opacity:(.15+.55*(.5+.5*Math.sin(t*.65+i*.41)))*depth
    };
  });
  return <svg viewBox="0 0 1920 1080" width="1920" height="1080" aria-hidden="true" style={{position:'absolute',inset:0,opacity:.8,pointerEvents:'none',mixBlendMode:'screen'}}>
    <defs>
      <radialGradient id="morphAmbient">
        <stop stopColor={color} stopOpacity=".14"/>
        <stop offset="1" stopColor={color} stopOpacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="960" cy="540" rx="800" ry="480" fill="url(#morphAmbient)"/>
    {positions.filter((_,i)=>i%7===0&&i+1<positions.length).map((pos,i)=>{
      const next=positions[i*7+1];
      return <line key={'l'+i} x1={pos.x} y1={pos.y} x2={next.x} y2={next.y} stroke={color} strokeWidth="1.1" opacity={pos.opacity*.28}/>;
    })}
    {positions.map((pos,i)=><circle key={i} cx={pos.x} cy={pos.y} r={pos.r} fill={i%6===0?GOLD:color} opacity={pos.opacity}/>)}
  </svg>;
}

function GlobalWorld({t}:{t:number}){
  const shiftX=54*Math.sin(t*.085),shiftY=32*Math.cos(t*.09),spin=t*1.5;
  return <AbsoluteFill style={{background:'radial-gradient(ellipse at 70% 32%,#143E43 0%,transparent 49%),radial-gradient(ellipse at 18% 75%,#183759 0%,transparent 60%),#05101F',overflow:'hidden'}}>
    <AbsoluteFill style={{opacity:.11,transform:`translate(${shiftX}px,${shiftY}px)`,backgroundImage:'linear-gradient(90deg,#C3E8F0 1px, transparent 1px),linear-gradient(#C3E8F0 1px, transparent 1px)',backgroundSize:'108px 108px',maskImage:'radial-gradient(ellipse at center,#000,transparent 79%)'}}/>
    <AbsoluteFill style={{background:'radial-gradient(circle at 48% 49%,rgba(34,184,151,.14),transparent 42%)',transform:`scale(${1.1+.13*Math.sin(t*.035)})`}}/>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
      <defs><linearGradient id="halo" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#D7B36D" stopOpacity=".65"/><stop offset=".55" stopColor="#8CDBD8" stopOpacity=".06"/><stop offset="1" stopColor="#D7B36D" stopOpacity=".45"/></linearGradient></defs>
      <g transform={`translate(${970+shiftX} ${535+shiftY}) rotate(${spin})`}>
        {[370,520,675].map((r,i)=><ellipse key={r} rx={r*1.4} ry={r*.62} fill="none" stroke="url(#halo)" strokeWidth={i?1.3:2.5} opacity={i? .24:.32} transform={`rotate(${i*53})`}/>)}
      </g>
      {STARS.map((star,i)=><circle key={i} cx={(star.x+t*star.speed*6)%1930} cy={(star.y+t*star.speed*2.3)%1090} r={star.r} fill={i%4===0?GOLD:'#ACF7E4'} opacity={.22+.5*(.5+.5*Math.sin(t*(.28+star.speed*.03)+i))}/>)}
      {[0,1,2,3,4].map((i)=><path key={i} d={`M${-200+20*i} ${120+185*i+Math.sin(t*.25+i)*32} Q960 ${210+140*i+Math.sin(t*.16+i)*72} 2200 ${-30+160*i}`} fill="none" stroke={i%2?GOLD:MINT} strokeOpacity={.06+i*.012} strokeWidth={i===2?3:1.5}/>) }
    </svg>
    <MorphParticles t={t}/>
    <AbsoluteFill style={{border:'38px solid rgba(183,234,222,.012)',pointerEvents:'none'}}/>
  </AbsoluteFill>;
}
const ShimmerLine=({width=660,style}:{width?:number;style?:React.CSSProperties})=><div style={{width,height:3,background:`linear-gradient(90deg,transparent,${GOLD},${MINT},transparent)`,boxShadow:`0 0 32px ${GOLD}60`,...style}}/>;

function BrandMark({src,width=220,height=160}:{src:string;width?:number;height?:number}){
  return <div style={{width,height,borderRadius:30,background:'linear-gradient(135deg,rgba(250,255,252,.94),rgba(228,247,238,.88))',boxShadow:'0 18px 52px rgba(0,0,0,.4),inset 0 0 0 1px rgba(255,255,255,.25)',display:'flex',alignItems:'center',justifyContent:'center',padding:17}}>
    <Img src={S(src)} style={{maxHeight:'100%',maxWidth:'100%',objectFit:'contain',width:'100%',height:'100%'}}/>
  </div>;
}

function Opening({t,props}:{t:number;props:StudioProps}){
  const enter=stagger(t,.4,2);
  const words=props.headline.split(' ');
  const main=words.slice(0,2).join(' ') || 'SELAMAT DATANG';
  const second=words.slice(2).join(' ') || 'MAHASISWA PPG 2026';
  const first=stagger(t,3,1.7),secondReveal=stagger(t,5.0,1.9),third=stagger(t,7.6,1.3);
  const exit=1-ease((t-13.3)/1.5);
  return <AbsoluteFill style={{opacity:enter*exit,alignItems:'center',justifyContent:'center',perspective:1400}}>
    <div style={{position:'absolute',width:820,height:820,top:160,left:550,borderRadius:'50%',border:`2px solid ${GOLD}55`,transform:`rotateY(${t*7}deg) rotate(${t*3}deg) scale(${.75+.20*stagger(t,0,4)})`,boxShadow:'0 0 120px rgba(215,183,108,.11)'}}/>
    <div style={{position:'absolute',top:105,display:'flex',gap:36,alignItems:'center',transform:`translateY(${(1-stagger(t,1,2))*-170}px)`,opacity:stagger(t,1,2)}}>
      <BrandMark src={LOGOS[0].src} width={160} height={160}/>
      <BrandMark src={LOGOS[1].src} width={195} height={150}/>
      <BrandMark src={LOGOS[2].src} width={210} height={155}/>
    </div>
    <div style={{position:'absolute',top:350,textAlign:'center',width:1750}}>
      <div style={{marginTop:35,fontWeight:900,fontSize:125,lineHeight:1.02,letterSpacing:5,color:WHITE,textShadow:'0 14px 90px rgba(90,247,216,.24)',opacity:first,transform:`translateY(${(1-first)*110}px) scale(${1.1-first*.1})`}}>{main}</div>
      <div style={{marginTop:20,fontWeight:900,fontSize:91,lineHeight:1.08,letterSpacing:3,color:GOLD,textShadow:'0 0 66px rgba(250,209,116,.25)',opacity:secondReveal,transform:`translateY(${(1-secondReveal)*80}px) rotateX(${(1-secondReveal)*-35}deg)`}}>{second}</div>
      <div style={{display:'flex',justifyContent:'center',margin:'35px auto 27px',opacity:third}}><ShimmerLine width={980}/></div>
      <div style={{fontSize:45,fontWeight:600,letterSpacing:7,color:WHITE,opacity:third,transform:`translateY(${(1-third)*40}px)`}}>{props.subheading}</div>
    </div>
  </AbsoluteFill>;
}

function GroupHeading({title,subtitle,t,top=112}:{title:string;subtitle:string;t:number;top?:number}){
  const alpha=stagger(t,0,.9);
  return <div style={{position:'absolute',top,left:145,right:145,opacity:alpha,transform:`translateX(${(1-alpha)*-85}px)`}}>
    <div style={{fontSize:21,fontWeight:750,letterSpacing:10,color:GOLD}}>{subtitle.toUpperCase()}</div>
    <div style={{fontSize:57,fontWeight:850,color:WHITE,marginTop:16,letterSpacing:1.5}}>{title}</div>
    <ShimmerLine width={680} style={{marginTop:21}}/>
  </div>;
}
const GROUP_META:{[K in PersonGroup]:{title:string,subtitle:string,intro:number,slot:number}}={
  university:{title:'Pimpinan Universitas Mengucapkan Selamat Datang',subtitle:'UIN SUNAN KALIJAGA YOGYAKARTA',intro:4,slot:7},
  fitk:{title:'Fakultas Ilmu Tarbiyah dan Keguruan',subtitle:'JAJARAN DEKANAT DAN TATA USAHA',intro:4,slot:7},
  program:{title:'Pengelola Program Studi PPG',subtitle:'KAPRODI DAN SEKRETARIS PROGRAM STUDI',intro:3,slot:7},
  teachers:{title:'Mengenal Wali Kelas PPG 2026',subtitle:'EMPAT WALI KELAS • SATU SEMANGAT',intro:3,slot:7},
};

function PortraitCard({person,rel,odd}:{person:Person;rel:number;odd:boolean}){
  const fade=stagger(rel,-.3,.95)*(1-stagger(rel,6.55,.7));
  const slide=(1-stagger(rel,-.3,1.3))*(odd?-330:330) + stagger(rel,6.5,.75)*(odd?220:-220);
  const x=odd?180:1180;
  const textX=odd?850:140;
  const textStart=stagger(rel,.43,.78)*(1-stagger(rel,6.57,.65));
  return <AbsoluteFill style={{opacity:fade,perspective:1700}}>
    <div style={{position:'absolute',top:260,left:x-70,width:710,height:660,borderRadius:'50%',background:'radial-gradient(ellipse,rgba(83,225,182,.23),transparent 68%)',filter:'blur(28px)',transform:`scale(${1+.04*Math.sin(rel)})`}}/>
    <div style={{position:'absolute',left:x,top:237,width:585,height:715,overflow:'hidden',borderRadius:30,background:'#DAE0E2',border:`3px solid ${GOLD}99`,transform:`translateX(${slide}px) rotateY(${(1-stagger(rel,-.3,1.2))*(odd?25:-25)+Math.sin(rel*.4)*3}deg) scale(${.96+stagger(rel,-.3,1.4)*.045})`,boxShadow:'0 45px 120px rgba(0,0,0,.62),0 0 60px rgba(175,229,196,.14)'}}>
      <Img src={S(person.image)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}}/>
      <div style={{position:'absolute',left:0,right:0,bottom:0,height:95,background:'linear-gradient(transparent,rgba(5,17,30,.67))'}}/>
    </div>
    <div style={{position:'absolute',left:textX,top:425,width:870,opacity:textStart,transform:`translateY(${(1-textStart)*68}px) translateX(${Math.sin(rel*.28)*12}px)`}}>
      <div style={{fontSize:person.name.length>40?59:69,fontWeight:900,color:WHITE,lineHeight:1.18,textShadow:'0 12px 70px rgba(0,0,0,.4)',maxWidth:870}}>{person.name}</div>
      <ShimmerLine width={570} style={{marginTop:30,marginBottom:25}}/>
      <div style={{fontSize:38,color:GOLD,fontWeight:760,letterSpacing:1}}>{person.role}</div>
      <div style={{fontSize:27,lineHeight:1.4,color:'#B8D9DE',fontWeight:540,marginTop:12,maxWidth:740}}>{person.detail}</div>
    </div>
  </AbsoluteFill>;
}
function GroupEnsemble({people,t}:{people:Person[];t:number}){
  const alpha=stagger(t,0,.9);
  const count=people.length;
  const cardWidth=count===2?490:count===4?300:248;
  return <div style={{position:'absolute',top:345,width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:count===2?60:30,opacity:alpha,transform:`translateY(${(1-alpha)*80}px)`}}>
    {people.map((p,i)=><div key={p.id} style={{width:cardWidth,transform:`translateY(${Math.sin(t*.55+i)*15}px) rotateY(${(i-(count-1)/2)*-6}deg)`,textAlign:'center'}}>
      <div style={{height:count===2?390:300,borderRadius:20,overflow:'hidden',border:`2px solid ${GOLD}80`,background:'#D7DCDF',boxShadow:'0 20px 60px #0018'}}><Img src={S(p.image)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 16%'}}/></div>
      <div style={{fontSize:count>4?19:22,color:WHITE,fontWeight:750,marginTop:20}}>{p.short}</div>
    </div>)}
  </div>;
}
function GroupScene({group,t,people}:{group:PersonGroup;t:number;people:Person[]}){
  const items=people.filter(p=>p.group===group);
  const info=GROUP_META[group];
  const totalSlots=items.length*info.slot;
  const elapsed=t-info.intro;
  const groupSpecific=group==='university'?'PIMPINAN UNIVERSITAS MENGUCAPKAN SELAMAT DATANG KEPADA MAHASISWA PPG':info.subtitle;
  return <AbsoluteFill style={{perspective:1300}}>
    <GroupHeading title={info.title} subtitle={groupSpecific} t={t} top={120}/>
    {t<info.intro+2 && <div style={{position:'absolute',top:490,left:150,width:1580,opacity:stagger(t,.4,1)*(1-stagger(t,info.intro+.7,.7)),transform:`translateY(${Math.sin(t*.5)*20}px)`,fontSize:39,fontWeight:660,color:'#BED9DC',letterSpacing:5}}>SELAMAT DATANG • MAHASISWA PPG ANGKATAN 2026</div>}
    {items.map((person,i)=>{
      const slot=elapsed-i*info.slot;
      if(slot<-.65||slot>info.slot+.15)return null;
      return <PortraitCard key={person.id} person={person} rel={slot} odd={i%2===1}/>;
    })}
    {elapsed>totalSlots-.1 && <GroupEnsemble people={items} t={elapsed-totalSlots}/>}
    <div style={{position:'absolute',right:150,bottom:105,display:'flex',gap:12}}>{items.map((p,i)=><div key={p.id} style={{width:i===Math.floor(elapsed/info.slot)?58:15,height:8,borderRadius:9,background:i===Math.floor(elapsed/info.slot)?GOLD:'#ABDDC840',transition:'none'}}/>)}</div>
  </AbsoluteFill>;
}

function CountNumber({num,t,delay=0,seconds=2.8}:{num:number;t:number;delay?:number;seconds?:number}){
 return <>{thousands(Math.round(num*ease((t-delay)/seconds)))}</>;
}
function StatisticsScene({t,stats}:{t:number;stats:StudioProps['stats']}){
  const phases=[{a:0,b:4},{a:4,b:11},{a:11,b:18},{a:18,b:32},{a:32,b:42},{a:42,b:45}];
  const active=(i:number)=>opacityAt(t,phases[i].a,phases[i].b);
  return <AbsoluteFill>
    <GroupHeading title="Statistik Data Lapor Diri PPG 2026" subtitle="INFOGRAFIS BERGERAK • 15 NOVEMBER 2026" t={t} top={105}/>
    <AbsoluteFill style={{opacity:active(0),alignItems:'center',justifyContent:'center'}}>
      <div style={{fontSize:29,letterSpacing:11,color:MINT,fontWeight:700}}>DATA UNIVERSE</div>
      <div style={{fontSize:104,fontWeight:900,color:WHITE,marginTop:25,transform:`scale(${.75+stagger(t,.3,3)*.25})`}}>SETIAP ANGKA, SEBUAH CERITA</div>
      <ShimmerLine width={1050} style={{marginTop:35}}/>
    </AbsoluteFill>
    <AbsoluteFill style={{opacity:active(1),alignItems:'center',justifyContent:'center'}}>
      <div style={{position:'absolute',width:950,height:950,borderRadius:'50%',border:`3px solid ${GOLD}44`,boxShadow:`0 0 90px ${GOLD}12`,transform:`rotate(${t*12}deg)`}}/>
      <div style={{fontSize:35,color:MINT,letterSpacing:11,fontWeight:760}}>TOTAL DATA LAPOR DIRI</div>
      <div style={{fontSize:235,fontWeight:900,color:GOLD,letterSpacing:-8,textShadow:`0 0 90px ${GOLD}50`,lineHeight:1.22}}><CountNumber num={stats.total} t={t-4}/></div>
      <div style={{fontSize:37,color:WHITE,fontWeight:690}}>ENTRI DALAM WORKBOOK TERBARU</div>
      <div style={{fontSize:20,color:'#AECBD2',marginTop:24}}>Berdasarkan berkas {stats.source}</div>
    </AbsoluteFill>
    <AbsoluteFill style={{opacity:active(2),alignItems:'center',justifyContent:'center'}}>
      <div style={{display:'flex',gap:60,marginTop:160}}>
        {stats.gender.map((g,i)=>{const pct=ease((t-11-i*.22)/3.3);return <div key={g.label} style={{width:590,height:530,borderRadius:35,padding:'66px 56px',boxSizing:'border-box',border:'1px solid #83D2BE60',background:'linear-gradient(145deg,#143C44DF,#0A1E31E8)',boxShadow:'0 30px 85px #0008',transform:`translateY(${(1-pct)*110}px)`}}>
          <div style={{fontSize:28,letterSpacing:5,color:MINT,fontWeight:720}}>{g.label.toUpperCase()}</div>
          <div style={{fontSize:129,color:WHITE,fontWeight:900,marginTop:43}}><CountNumber num={g.value} t={t-11}/></div>
          <div style={{fontSize:56,color:i?GOLD:MINT,fontWeight:780}}>{g.percent}%</div>
          <div style={{height:15,borderRadius:20,background:'#51717A77',overflow:'hidden',marginTop:35}}><div style={{width:`${g.percent*pct}%`,height:'100%',background:i?GOLD:MINT,borderRadius:20}}/></div>
        </div>;})}
      </div>
    </AbsoluteFill>
    <AbsoluteFill style={{opacity:active(3)}}>
      <div style={{position:'absolute',top:310,left:185,right:185}}>
        <div style={{fontSize:28,color:MINT,letterSpacing:8,fontWeight:720,marginBottom:22}}>DISTRIBUSI MATA PELAJARAN</div>
        {stats.subjects.map((s,i)=>{const p=stagger(t-18,i*.22,1.7);return <div key={s.label} style={{display:'flex',alignItems:'center',gap:20,height:67,opacity:p}}>
          <div style={{width:440,fontSize:25,fontWeight:650,color:WHITE}}>{s.label}</div>
          <div style={{flex:1,height:24,borderRadius:15,background:'#547D7A40',overflow:'hidden'}}><div style={{width:`${s.value/(stats.subjects[0]?.value||1)*100*p}%`,height:'100%',background:`linear-gradient(90deg,${MINT},${GOLD})`,borderRadius:15,boxShadow:`0 0 25px ${MINT}50`}}/></div>
          <div style={{width:105,textAlign:'right',color:GOLD,fontSize:31,fontWeight:800}}>{thousands(Math.round(s.value*p))}</div>
        </div>})}
      </div>
    </AbsoluteFill>
    <AbsoluteFill style={{opacity:active(4)}}>
      <div style={{position:'absolute',left:150,top:325,width:750}}>
        <div style={{fontSize:28,letterSpacing:7,color:MINT,fontWeight:700}}>6 PROVINSI TEMPAT TUGAS</div>
        <div style={{fontSize:95,fontWeight:900,color:GOLD,marginTop:14}}>INDONESIA</div>
        <div style={{fontSize:31,color:'#B8D9DE',lineHeight:1.5,marginTop:18}}>Sebaran berdasarkan provinsi tempat tugas yang tercatat dalam Excel terbaru.</div>
        <svg width="640" height="280" viewBox="0 0 640 280" style={{marginTop:45}}>
          <path d="M45 178 Q113 100 178 158 T301 150 T435 166 T583 121" fill="none" stroke={GOLD} strokeWidth="5" strokeOpacity=".6" strokeDasharray="8 17"/>
          {[[52,171],[167,147],[280,156],[402,164],[496,134],[585,121]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={11+3*Math.sin(t+i)} fill={MINT} opacity={stagger(t-32,i*.4,.7)}/><circle cx={x} cy={y} r="25" fill="none" stroke={GOLD} strokeOpacity={.4} /></g>)}
        </svg>
      </div>
      <div style={{position:'absolute',right:125,top:316,width:720}}>
        {stats.provinces.map((p,i)=>{const a=stagger(t-32,i*.33,1.4);return <div key={p.label} style={{height:93,opacity:a,display:'flex',gap:23,alignItems:'center'}}>
          <div style={{width:50,height:50,borderRadius:17,background:'#28645B',color:GOLD,fontWeight:800,fontSize:20,display:'grid',placeItems:'center'}}>{String(i+1).padStart(2,'0')}</div>
          <div style={{flex:1}}><div style={{fontSize:26,fontWeight:760,color:WHITE,marginBottom:10}}>{p.label}</div><div style={{height:9,borderRadius:10,background:'#A2CDCA33'}}><div style={{width:`${p.value/(stats.provinces[0]?.value||1)*100*a}%`,height:'100%',background:MINT,borderRadius:10}}/></div></div>
          <div style={{fontSize:34,fontWeight:900,color:GOLD,width:125,textAlign:'right'}}>{thousands(Math.round(p.value*a))}</div>
        </div>})}
      </div>
    </AbsoluteFill>
    <AbsoluteFill style={{opacity:active(5),alignItems:'center',justifyContent:'center'}}>
      <div style={{fontSize:45,letterSpacing:11,color:MINT,fontWeight:760}}>SATU SEMANGAT, MENJADI GURU PROFESIONAL</div>
      <div style={{fontSize:150,fontWeight:900,color:GOLD,marginTop:45}}>{thousands(stats.total)} DATA</div>
      <ShimmerLine width={1060} style={{marginTop:30}}/>
    </AbsoluteFill>
  </AbsoluteFill>;
}
function Closing({t,props}:{t:number;props:StudioProps}){
  const show=stagger(t,.4,2);
  const outro=1-stagger(t,8.1,1.9);
  return <AbsoluteFill style={{alignItems:'center',justifyContent:'center',opacity:show*outro,perspective:1500}}>
    <div style={{display:'flex',gap:40,alignItems:'center',transform:`translateY(${(1-show)*100}px) scale(${.9+.1*show})`,marginTop:-165}}>
      <BrandMark src={LOGOS[0].src} width={205} height={205}/><BrandMark src={LOGOS[1].src} width={255} height={190}/><BrandMark src={LOGOS[2].src} width={260} height={190}/>
    </div>
    <div style={{fontSize:89,fontWeight:900,color:GOLD,letterSpacing:6,marginTop:65,textShadow:`0 0 80px ${GOLD}45`}}>SELAMAT BERGABUNG</div>
    <div style={{fontSize:69,fontWeight:800,color:WHITE,marginTop:21}}>MAHASISWA PPG 2026</div>
    <ShimmerLine width={1100} style={{marginTop:35,marginBottom:29}}/>
    <div style={{fontSize:37,fontWeight:650,color:'#BFE7DE',letterSpacing:6}}>{props.subheading}</div>
  </AbsoluteFill>;
}

export function Bumper(props:StudioProps){
 const frame=useCurrentFrame();const t=frame/30;
 return <AbsoluteFill style={{fontFamily:'Arial, Helvetica, sans-serif',color:WHITE,background:'#061426',overflow:'hidden'}}>
   <GlobalWorld t={t}/>
   {SECTIONS.map(s=>{
     const alpha=opacityAt(t,s.start,s.start+s.duration);
     if(alpha<=0)return null;
     const local=t-s.start;
     return <AbsoluteFill key={s.id} style={{opacity:alpha}}>
       {s.id==='opening' && <Opening t={local} props={props}/>}
       {s.id==='university' && <GroupScene group="university" t={local} people={props.people}/>}
       {s.id==='fitk' && <GroupScene group="fitk" t={local} people={props.people}/>}
       {s.id==='program' && <GroupScene group="program" t={local} people={props.people}/>}
       {s.id==='teachers' && <GroupScene group="teachers" t={local} people={props.people}/>}
       {s.id==='statistics' && <StatisticsScene t={local} stats={props.stats}/>}
       {s.id==='closing' && <Closing t={local} props={props}/>}
     </AbsoluteFill>;
   })}
   {props.musicEnabled && <Audio src={S(props.musicSrc)} volume={m(props.musicVolume)} />}
   {props.sfxEnabled && <Audio src={S(props.sfxSrc)} volume={m(props.sfxVolume)} />}
   <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(0,0,0,.26),transparent 18%,transparent 78%,rgba(0,0,0,.2))'}}/>
 </AbsoluteFill>;
}
