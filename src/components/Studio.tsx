'use client';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Player,type PlayerRef} from '@remotion/player';
import {Bumper} from '@/remotion/Bumper';
import {DEFAULT_PROPS,DURATION,FPS,LOGOS,PEOPLE,SECTIONS,StudioProps,Stats,Person,timer,thousands,WIDTH,HEIGHT} from '@/data/project';
import {
  Aperture,ArrowDownToLine,BarChart3,Check,ChevronRight,Clapperboard,CloudUpload,
  FileJson,FileSpreadsheet,Film,FolderOpen,Headphones,ImageIcon,Info,Layers3,
  Maximize2,Music2,Pause,Play,RotateCcw,Settings2,ShieldCheck,SlidersHorizontal,
  Sparkles,Users,Volume2,VolumeX,WandSparkles,X,CheckCircle2,AlertTriangle
} from 'lucide-react';

type Panel='project'|'scenes'|'cast'|'stats'|'audio'|'export';
type RenderStatus={id:string;status:'queued'|'bundling'|'rendering'|'done'|'error';progress:number;message?:string;fileUrl?:string};
const NAV:{id:Panel;label:string;icon:React.ComponentType<{size?:number;strokeWidth?:number}>}[]=[
  {id:'project',label:'Pengaturan',icon:SlidersHorizontal},
  {id:'scenes',label:'Urutan Adegan',icon:Layers3},
  {id:'cast',label:'Foto & Tokoh',icon:Users},
  {id:'stats',label:'Statistik Excel',icon:BarChart3},
  {id:'audio',label:'Musik & Efek',icon:Headphones},
  {id:'export',label:'Ekspor Video',icon:Film},
];

function StatMini({title,value,sub}:{title:string;value:string;sub:string}){
 return <div className="miniStat"><span>{title}</span><strong>{value}</strong><small>{sub}</small></div>;
}

export function Studio(){
 const player=useRef<PlayerRef>(null);
 const [panel,setPanel]=useState<Panel>('project');
 const [props,setProps]=useState<StudioProps>(DEFAULT_PROPS);
 const [frame,setFrame]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [isMuted,setMuted]=useState(false);
 const [quality,setQuality]=useState<'fullhd'|'hd'>('fullhd');
 const [job,setJob]=useState<RenderStatus|null>(null);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [uploading,setUploading]=useState(false);
 const [selectedPersonId,setSelectedPersonId]=useState<string|null>('rektor');
 const statusText=useMemo(()=>SECTIONS.find(s=>frame/FPS>=s.start&&frame/FPS<s.start+s.duration)??SECTIONS[6],[frame]);
 const update=useCallback(<K extends keyof StudioProps,>(key:K,v:StudioProps[K])=>setProps(old=>({...old,[key]:v})),[]);
 const goTo=useCallback((seconds:number)=>{player.current?.seekTo(Math.max(0,Math.min(DURATION*FPS-1,Math.round(seconds*FPS))));setFrame(Math.round(seconds*FPS));},[]);
 useEffect(()=>{
   const ref=player.current;if(!ref)return;
   const time=(e:{detail:{frame:number}})=>setFrame(e.detail.frame);
   const play=()=>setPlaying(true);
   const pause=()=>setPlaying(false);
   ref.addEventListener('timeupdate',time);
   ref.addEventListener('seeked',time);
   ref.addEventListener('play',play);
   ref.addEventListener('pause',pause);
   return ()=>{ref.removeEventListener('timeupdate',time);ref.removeEventListener('seeked',time);ref.removeEventListener('play',play);ref.removeEventListener('pause',pause);};
 },[]);
 useEffect(()=>{
  if(!job || (job.status==='done'||job.status==='error'))return;
  const id=window.setInterval(async()=>{
    try{
      const response=await fetch(`/api/render/${job.id}`,{cache:'no-store'});
      const body=await response.json();if(response.ok)setJob(body);
    }catch{ /* allow retry on next poll */ }
  },2100);
  return ()=>window.clearInterval(id);
 },[job?.id,job?.status]);
 const selectedPerson=props.people.find(p=>p.id===selectedPersonId);
 const updatePerson=(id:string,patch:Partial<Person>)=>update('people',props.people.map(p=>p.id===id?{...p,...patch}:p));
 const uploadPhoto=async(file:File,id:string)=>{
   setUploading(true);setNotice('Mengunggah foto profil...');
   try{
     const data=new FormData();data.append('file',file);data.append('kind','photo');
     const res=await fetch('/api/assets/upload',{method:'POST',body:data});const body=await res.json();
     if(!res.ok)throw new Error(body.error||'Foto gagal diunggah.');
     updatePerson(id,{image:body.url});setNotice('Foto baru siap untuk preview dan render lokal.');
   }catch(e){setNotice(e instanceof Error?e.message:'Foto gagal diunggah.');}finally{setUploading(false);}
 };
 const toggle=()=>player.current?.toggle();
 const reset=()=>{setProps(DEFAULT_PROPS);setNotice('Konfigurasi dikembalikan ke awal.');};
 const downloadSettings=()=>{
  const blob=new Blob([JSON.stringify({type:'ppg-2026-studio',version:1,props},null,2)],{type:'application/json'});
  const uri=URL.createObjectURL(blob);const a=document.createElement('a');a.href=uri;a.download='PPG2026_konfigurasi.json';a.click();URL.revokeObjectURL(uri);
 };
 const uploadSettings=async(file:File)=>{
  try{
   const json=JSON.parse(await file.text());
   if(json.type!=='ppg-2026-studio'||!json.props||typeof json.props.headline!=='string'||!json.props.stats)throw new Error('Format konfigurasi tidak cocok.');
   setProps({...DEFAULT_PROPS,...json.props});setNotice('Konfigurasi berhasil dimuat.');
  }catch(e){setNotice(e instanceof Error?e.message:'Gagal membaca konfigurasi.');}
 };
 const uploadExcel=async(file:File)=>{
  setUploading(true);setNotice('Membaca Excel...');
  try{
   const data=new FormData();data.append('file',file);
   const res=await fetch('/api/stats/import',{method:'POST',body:data});const body=await res.json();
   if(!res.ok)throw new Error(body.error||'Excel tidak dapat diproses.');
   update('stats',body.stats as Stats);setNotice(`Excel berhasil dibaca: ${body.stats.total.toLocaleString('id-ID')} entri.`);
  }catch(e){setNotice(e instanceof Error?e.message:'Impor gagal.');}finally{setUploading(false);}
 };
 const uploadAudio=async(file:File,kind:'music'|'sfx')=>{
  setUploading(true);setNotice('Mengunggah file audio...');
  try{
   const data=new FormData();data.append('file',file);data.append('kind',kind);
   const res=await fetch('/api/assets/upload',{method:'POST',body:data});const body=await res.json();
   if(!res.ok)throw new Error(body.error||'Audio gagal diunggah.');
   update(kind==='music'?'musicSrc':'sfxSrc',body.url);setNotice('Audio baru siap untuk pratinjau dan render lokal.');
  }catch(e){setNotice(e instanceof Error?e.message:'Unggahan gagal.');}finally{setUploading(false);}
 };
 const renderVideo=async()=>{
  if(busy||job?.status==='rendering'||job?.status==='bundling')return;
  setBusy(true);setNotice('');
  try{
   const res=await fetch('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({props,quality})});
   const body=await res.json();if(!res.ok)throw new Error(body.error||'Gagal memulai render.');
   setJob({id:body.id,status:'queued',progress:0,message:'Mempersiapkan render'});
  }catch(e){setNotice(e instanceof Error?e.message:'Render tidak bisa dimulai.');}finally{setBusy(false);}
 };
 return <div className="appShell">
  <aside className="sidebar">
   <div className="brand"><div className="brandIcon"><Aperture size={29}/></div><div><strong>PPG MOTION</strong><span>CREATIVE STUDIO</span></div></div>
   <div className="sidebarContext"><span className="liveDot"/> PROYEK AKTIF <strong>PPG 2026</strong><small>UIN Sunan Kalijaga</small></div>
   <div className="navLabel">RUANG KERJA</div>
   <nav className="navList">{NAV.map(({id,label,icon:Icon})=><button type="button" key={id} className={`navButton ${panel===id?'active':''}`} onClick={()=>setPanel(id)}><Icon size={19} strokeWidth={1.9}/><span>{label}</span>{panel===id&&<ChevronRight size={16} className="navArrow"/>}</button>)}</nav>
   <div className="sideBottom"><div className="sideBottomTop"><ShieldCheck size={20}/> <span>ASET LENGKAP</span></div><strong>15 tokoh • 3 logo</strong><p>Foto asli tersimpan terpisah. Semua data statistik berasal dari workbook terbaru.</p><div className="sideBottomProgress"><div/></div><small>Siap pratinjau dan produksi</small></div>
   <div className="sideCopyright">© 2026 • UIN Sunan Kalijaga<br/>Cinematic Motion Studio</div>
  </aside>
  <main className="mainArea">
   <header className="topbar"><div className="breadcrumbs">STUDIO <ChevronRight size={14}/> PROYEK AKTIF <ChevronRight size={14}/> <strong>PPG 2026</strong></div><div className="headerRight"><span className="online"><span/>Pratinjau Siap</span><button type="button" className="headIcon" title="Tampilkan penuh" onClick={()=>player.current?.requestFullscreen()}><Maximize2 size={17}/></button></div></header>
   <div className="pageContents">
    <section className="headlineRow"><div><div className="eyebrow"><Sparkles size={16}/> CINEMATIC MOTION EXPERIENCE <span> / </span> UNIVERSITY EDITION</div><h1>Bumper Penyambutan <em>PPG 2026</em></h1><p>15 tokoh, tiga logo resmi, musik orisinal, dan statistik dari Excel terbaru — dalam satu perjalanan visual yang bergerak.</p></div><button className="primaryButton headerRender" onClick={()=>{setPanel('export');document.getElementById('editorTools')?.scrollIntoView({behavior:'smooth',block:'nearest'});}}><ArrowDownToLine size={17}/> Ekspor MP4</button></section>
    <section className="quickInfo"><StatMini title="TOTAL DURASI" value="03:24" sub="204 detik sinematik"/><StatMini title="RESOLUSI" value="FULL HD" sub="1920 × 1080 • 30 fps"/><StatMini title="TOKOH TERDAFTAR" value="15 PROFIL" sub="Foto dan nama lengkap"/><StatMini title="DATA TERBARU" value={thousands(props.stats.total)} sub="Entri lapor diri"/></section>
    <div className="workspaceGrid">
     <section className="workCenter">
      <div className="sectionTop"><div><h2><Clapperboard size={20}/> Live Cinematic Preview</h2><span>Remotion Player • Sumber yang sama untuk preview dan MP4</span></div><div className="videoStatus"><span className="liveDot"/> LIVE PREVIEW</div></div>
      <div className="playerFrame"><Player ref={player} component={Bumper} inputProps={{...props,musicEnabled:props.musicEnabled&&!isMuted,sfxEnabled:props.sfxEnabled&&!isMuted}} durationInFrames={DURATION*FPS} compositionWidth={WIDTH} compositionHeight={HEIGHT} fps={FPS} autoPlay={false} controls={false} clickToPlay={true} style={{width:'100%',aspectRatio:'16 / 9'}}/>
        <div className="frameLabel"><span className="frameLabelDot"/> {statusText.short.toUpperCase()} <span> / </span> {statusText.tag}</div>
      </div>
      <div className="playerControlBar"><button className="roundPlay" onClick={toggle} aria-label={playing?'Jeda':'Putar'}>{playing?<Pause size={19} fill="currentColor"/>:<Play size={19} fill="currentColor"/>}</button><div className="timeReadout">{timer(frame/FPS)} <span>/ {timer(DURATION)}</span></div><div className="seekWrap"><input type="range" aria-label="Cari waktu video" min="0" max={DURATION*FPS-1} value={frame} step="1" onChange={e=>goTo(Number(e.target.value)/FPS)} style={{'--seek':`${frame/(DURATION*FPS)*100}%`} as React.CSSProperties}/></div><button className="controlIcon" onClick={()=>setMuted(!isMuted)} title={isMuted?'Aktifkan audio':'Bisukan audio'}>{isMuted?<VolumeX size={19}/>:<Volume2 size={19}/>}</button><button className="controlIcon" onClick={()=>goTo(0)} title="Kembali ke awal"><RotateCcw size={18}/></button><span className="fpsFlag">30 FPS</span></div>
      <div className="timelinePanel"><div className="sectionTop timelineHeading"><div><h2><Layers3 size={19}/> Timeline Produksi</h2><span>Pilih adegan untuk berpindah ke waktu tertentu</span></div><span className="timelineEnd">07 SEKUENS</span></div>
       <div className="timelineTrackWrap"><div className="trackLabel"><Film size={17}/> VIDEO <span>204 DETIK</span></div><div className="timelineTrack">{SECTIONS.map(s=><button type="button" key={s.id} title={`${s.title} — ${timer(s.start)}`} className={`timelineBlock ${statusText.id===s.id?'selected':''}`} style={{width:`${s.duration/DURATION*100}%`,'--block':s.color} as React.CSSProperties} onClick={()=>goTo(s.start)}><span>{s.short}</span></button>)}<div className="playHead" style={{left:`${frame/(DURATION*FPS)*100}%`}}/></div></div>
       <div className="timelineTrackWrap"><div className="trackLabel"><Music2 size={17}/> AUDIO <span>ORIGINAL SCORE + SFX</span></div><div className="audioTrack"><div className="audioWave">{Array.from({length:75},(_,i)=><i key={i} style={{height:`${15+(Math.sin(i*2.31)+1)*18+(i%6)*3}%`}}/>)}</div><div className="playHead" style={{left:`${frame/(DURATION*FPS)*100}%`}}/></div></div>
       <div className="timelineTicks">{[0,30,60,90,120,150,180,204].map(t=><span key={t} onClick={()=>goTo(t)} role="button" tabIndex={0}>{timer(t)}</span>)}</div>
      </div>
      <div className="assetOverview"><div className="sectionTop"><div><h2><ImageIcon size={19}/> Identitas Visual Resmi</h2><span>Logo asli berwarna dalam PNG transparan</span></div></div><div className="logoGrid">{LOGOS.map(l=><div key={l.id} className="logoTile"><div className="logoTileArt"><img src={l.src} alt={l.name}/></div><span>{l.name}</span><small>PNG transparan</small></div>)}</div></div>
     </section>
     <aside className="editor" id="editorTools"><div className="editorTop"><div><span>CONTROL CENTER</span><h2>{NAV.find(n=>n.id===panel)?.label}</h2></div><Settings2 size={20}/></div>
      {panel==='project'&&<div className="editorContent"><div className="settingGroup"><label>JUDUL OPENING</label><textarea rows={3} maxLength={100} value={props.headline} onChange={e=>update('headline',e.target.value)}/><small>Teks besar dengan kinetic typography.</small></div><div className="settingGroup"><label>SUBJUDUL INSTITUSI</label><textarea rows={3} maxLength={110} value={props.subheading} onChange={e=>update('subheading',e.target.value)}/></div><div className="divider"/><div className="infoCard"><WandSparkles size={21}/><div><strong>Continuous Motion</strong><p>Kamera 2.5D, orbit, parallax, streaks, partikel bergerak, dan cross-fade antar dunia visual.</p></div></div><div className="settingGroup"><label>WAKTU VIDEO</label><div className="settingValue"><Film size={16}/> 03:24 menit <span>tetap • 30 FPS</span></div></div><button type="button" className="subtleButton" onClick={reset}><RotateCcw size={16}/> Reset semua pengaturan</button><button type="button" className="outlineButton" onClick={downloadSettings}><FileJson size={16}/> Simpan konfigurasi JSON</button><label className="fileButton"><FolderOpen size={17}/> Muat konfigurasi JSON <input type="file" accept=".json,application/json" onChange={e=>{const f=e.target.files?.[0];if(f)uploadSettings(f);e.target.value='';}}/></label></div>}
      {panel==='scenes'&&<div className="editorContent"><p className="panelIntro">Setiap adegan terhubung melalui kamera, bukan pergantian slide.</p><div className="sceneList">{SECTIONS.map((s,i)=><button type="button" className={`sceneItem ${statusText.id===s.id?'active':''}`} key={s.id} onClick={()=>goTo(s.start)}><div className="sceneDot" style={{background:s.color}}>{String(i+1).padStart(2,'0')}</div><div><strong>{s.title}</strong><small>{timer(s.start)}–{timer(s.start+s.duration)}</small></div><ChevronRight size={16}/></button>)}</div><div className="infoCard"><Aperture size={20}/><div><strong>Continuous Camera</strong><p>Latar bergerak sepanjang video. Transition bertumpang tindih agar tidak ada layar kosong.</p></div></div></div>}
      {panel==='cast'&&<div className="editorContent"><div className="castTitle">15 FOTO ASLI <span>4 kelompok</span></div><div className="castGrid">{props.people.map(p=><button type="button" className={`castRow castButton ${selectedPersonId===p.id?'castActive':''}`} key={p.id} onClick={()=>setSelectedPersonId(p.id)}><img src={p.image} alt=""/><div><strong>{p.name}</strong><small>{p.role}</small></div><ChevronRight size={16}/></button>)}</div>{selectedPerson&&<div className="personEditor"><div className="personEditorHead"><img src={selectedPerson.image} alt={selectedPerson.name}/><div><strong>Ubah Profil Tokoh</strong><span>{selectedPerson.short}</span></div></div><div className="settingGroup"><label>NAMA LENGKAP & GELAR</label><textarea rows={3} value={selectedPerson.name} onChange={e=>updatePerson(selectedPerson.id,{name:e.target.value})}/></div><div className="settingGroup"><label>JABATAN</label><textarea rows={2} value={selectedPerson.role} onChange={e=>updatePerson(selectedPerson.id,{role:e.target.value})}/></div><div className="settingGroup"><label>KETERANGAN JABATAN</label><textarea rows={2} value={selectedPerson.detail} onChange={e=>updatePerson(selectedPerson.id,{detail:e.target.value})}/></div><label className="fileButton"><CloudUpload size={17}/> Ganti foto (.jpg/.png/.webp)<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)uploadPhoto(f,selectedPerson.id);e.target.value='';}}/></label></div>}<div className="infoCard"><ShieldCheck size={20}/><div><strong>Aset terjaga</strong><p>15 berkas asli disertakan di folder sources/originals; website memakai versi WebP yang lebih ringan. Perubahan tersimpan di konfigurasi jika Anda mengunduh JSON.</p></div></div></div>}
      {panel==='stats'&&<div className="editorContent"><div className="statsHero"><span>DATA LAPOR DIRI • SUMBER TERBARU</span><strong>{thousands(props.stats.total)}</strong><small>entri dari file Excel</small></div><div className="statSource"><FileSpreadsheet size={16}/><span>{props.stats.source}</span></div><div className="settingGroup"><label>JENIS KELAMIN</label>{props.stats.gender.map(g=><div className="metricRow" key={g.label}><span>{g.label}</span><strong>{thousands(g.value)}</strong><em>{g.percent}%</em></div>)}</div><div className="settingGroup"><label>8 MATA PELAJARAN</label>{props.stats.subjects.map(s=><div className="metricBar" key={s.label}><div><span>{s.label}</span><b>{thousands(s.value)}</b></div><div className="barBackground"><i style={{width:`${s.value/(props.stats.subjects[0]?.value||1)*100}%`}}/></div></div>)}</div><div className="settingGroup"><label>PROVINSI TEMPAT TUGAS</label>{props.stats.provinces.map(p=><div className="metricRow" key={p.label}><span>{p.label}</span><strong>{thousands(p.value)}</strong></div>)}</div><p className="disclaimer">{props.stats.disclaimer}</p><label className="uploadButton"><CloudUpload size={19}/><div><strong>{uploading?'Memproses...':'Unggah Excel terbaru'}</strong><small>Kolom: Jenis Kelamin, Mapel, Provinsi Tempat Tugas, Status Pegawai</small></div><input type="file" accept=".xlsx" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)uploadExcel(f);e.target.value='';}}/></label></div>}
      {panel==='audio'&&<div className="editorContent"><div className="audioHero"><Music2 size={26}/><div><strong>Original Cinematic Score</strong><span>03:24 • Orkestra sintetis orisinal</span></div></div><div className="settingGroup"><div className="toggleRow"><label>MUSIK LATAR</label><button type="button" aria-label="Musik aktif" className={`toggle ${props.musicEnabled?'on':''}`} onClick={()=>update('musicEnabled',!props.musicEnabled)}><span/></button></div><div className="rangeInfo"><span>Volume musik</span><strong>{Math.round(props.musicVolume*100)}%</strong></div><input className="customRange" type="range" min="0" max="1" step="0.01" disabled={!props.musicEnabled} value={props.musicVolume} onChange={e=>update('musicVolume',Number(e.target.value))}/></div><div className="settingGroup"><div className="toggleRow"><label>SOUND EFFECTS</label><button type="button" aria-label="Efek aktif" className={`toggle ${props.sfxEnabled?'on':''}`} onClick={()=>update('sfxEnabled',!props.sfxEnabled)}><span/></button></div><div className="rangeInfo"><span>Volume efek</span><strong>{Math.round(props.sfxVolume*100)}%</strong></div><input className="customRange" type="range" min="0" max="1" step="0.01" disabled={!props.sfxEnabled} value={props.sfxVolume} onChange={e=>update('sfxVolume',Number(e.target.value))}/></div><div className="settingGroup"><label>GANTI MUSIK (MP3/WAV)</label><label className="fileButton"><CloudUpload size={17}/> Unggah musik<input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)uploadAudio(f,'music');e.target.value='';}}/></label><small>{props.musicSrc}</small></div><div className="settingGroup"><label>GANTI EFEK SUARA (MP3/WAV)</label><label className="fileButton"><CloudUpload size={17}/> Unggah SFX<input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)uploadAudio(f,'sfx');e.target.value='';}}/></label><small>{props.sfxSrc}</small></div><div className="infoCard"><Headphones size={21}/><div><strong>Sinkron ke frame</strong><p>Musik dan efek menggunakan dua audio track berdurasi 204 detik yang diputar langsung di komposisi Remotion.</p></div></div></div>}
      {panel==='export'&&<div className="editorContent"><p className="panelIntro">Hasil video menggunakan komposisi yang sama dengan pratinjau.</p><div className="settingGroup"><label>RESOLUSI OUTPUT</label><div className="qualityGrid"><button className={quality==='fullhd'?'chosen':''} onClick={()=>setQuality('fullhd')}><strong>Full HD</strong><small>1920 × 1080</small></button><button className={quality==='hd'?'chosen':''} onClick={()=>setQuality('hd')}><strong>HD</strong><small>1280 × 720</small></button></div></div><div className="exportDetails"><div><span>Format</span><strong>MP4 • H.264</strong></div><div><span>Audio</span><strong>AAC • Stereo</strong></div><div><span>Frame rate</span><strong>30 FPS</strong></div><div><span>Durasi</span><strong>03:24</strong></div></div><button className="primaryButton wide" onClick={renderVideo} disabled={busy||job?.status==='rendering'||job?.status==='bundling'}><ArrowDownToLine size={18}/>{busy?'Memulai...':'Render & Ekspor MP4'}</button>{job&&<div className="jobBox"><div><strong>{job.status==='done'?'Video siap diunduh':job.status==='error'?'Render gagal':job.status==='rendering'?'Sedang merender':job.status==='bundling'?'Menyiapkan komposisi':'Menunggu proses'}</strong><span>{Math.round(job.progress*100)}%</span></div><div className="barBackground"><i style={{width:`${Math.max(1,job.progress*100)}%`}}/></div><small>{job.message}</small>{job.status==='done'&&job.fileUrl&&<a className="downloadButton" href={job.fileUrl} download><ArrowDownToLine size={17}/> Unduh hasil MP4</a>}</div>}<div className="infoCard warning"><Info size={21}/><div><strong>Render lokal / VPS</strong><p>Ekspor full video memerlukan Node.js dan Chromium. Di Vercel, halaman editor berfungsi tetapi render panjang memerlukan worker terpisah.</p></div></div><div className="infoCard"><CheckCircle2 size={21}/><div><strong>Alternatif CLI</strong><p>Jalankan <code>npm run render:mp4</code> di server lokal/VPS untuk ekspor Full HD.</p></div></div></div>}
      {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Tutup notifikasi"><X size={15}/></button></div>}
      <div className="editorFooter"><CheckCircle2 size={15}/> Proyek PPG 2026 • Data terhubung</div>
     </aside>
    </div>
    <footer className="pageFooter"><span>PPG CINEMATIC STUDIO <b>2026</b></span><span>Data nyata • Foto asli • Frame-based animation</span></footer>
   </div>
  </main>
 </div>;
}
