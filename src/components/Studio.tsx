'use client';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Player,type PlayerRef} from '@remotion/player';
import {Bumper} from '@/remotion/Bumper';
import {DEFAULT_PROPS,DURATION,FPS,SECTIONS,StudioProps,Stats,Person,timer,thousands,WIDTH,HEIGHT} from '@/data/project';
import {
  Aperture,ArrowDownToLine,BarChart3,CheckCircle2,ChevronRight,CloudUpload,
  Film,Headphones,Info,Layers3,Maximize2,Music2,Pause,Play,
  Repeat2,RotateCcw,ShieldCheck,Users,Volume2,VolumeX,X
} from 'lucide-react';

type Panel='scenes'|'cast'|'stats'|'audio'|'export';
type RenderStatus={id:string;status:'queued'|'bundling'|'rendering'|'done'|'error';progress:number;message?:string;fileUrl?:string};
const NAV:{id:Panel;label:string;icon:React.ComponentType<{size?:number;strokeWidth?:number}>}[]=[
  {id:'scenes',label:'Timeline Produksi',icon:Layers3},
  {id:'cast',label:'Foto & Tokoh',icon:Users},
  {id:'stats',label:'Statistik Excel',icon:BarChart3},
  {id:'audio',label:'Musik & Efek',icon:Headphones},
  {id:'export',label:'Ekspor Video',icon:Film},
];

export function Studio(){
 const player=useRef<PlayerRef>(null);
 const [panel,setPanel]=useState<Panel>('scenes');
 const [props,setProps]=useState<StudioProps>(DEFAULT_PROPS);
 const [frame,setFrame]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [isMuted,setMuted]=useState(false);
 const [looping,setLooping]=useState(false);
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
 return <div className="presentationShell">
    <section className="presentationStage" aria-label="Pemutar bumper penyambutan PPG 2026">
      <div className="presentationPlayer">
        <Player
          ref={player}
          component={Bumper}
          inputProps={{...props,musicEnabled:props.musicEnabled&&!isMuted,sfxEnabled:props.sfxEnabled&&!isMuted}}
          durationInFrames={DURATION*FPS}
          compositionWidth={WIDTH}
          compositionHeight={HEIGHT}
          fps={FPS}
          autoPlay={false}
          loop={looping}
          controls={false}
          clickToPlay
          style={{width:'100%',height:'100%'}}
        />
      </div>
      {!playing && frame===0 && <button type="button" className="presentationStart" onClick={toggle} aria-label="Putar bumper PPG 2026"><Play size={33} fill="currentColor"/><span>Putar bumper</span></button>}
      <div className="presentationControls">
        <button type="button" className="roundPlay" onClick={toggle} aria-label={playing?'Jeda video':'Putar video'}>{playing?<Pause size={20} fill="currentColor"/>:<Play size={20} fill="currentColor"/>}</button>
        <div className="timeReadout">{timer(frame/FPS)} <span>/ {timer(DURATION)}</span></div>
        <div className="seekWrap"><input type="range" aria-label="Waktu bumper" min="0" max={DURATION*FPS-1} value={frame} step="1" onChange={e=>goTo(Number(e.target.value)/FPS)} style={{'--seek':`${frame/(DURATION*FPS)*100}%`} as React.CSSProperties}/></div>
        <button type="button" className="controlIcon" onClick={()=>setMuted(!isMuted)} aria-label={isMuted?'Aktifkan musik dan efek':'Bisukan musik dan efek'}>{isMuted?<VolumeX size={20}/>:<Volume2 size={20}/>}</button>
        <button type="button" className="controlIcon" onClick={()=>goTo(0)} aria-label="Putar dari awal"><RotateCcw size={19}/></button>
        <button type="button" className={`controlIcon loopButton ${looping?'active':''}`} onClick={()=>setLooping(v=>!v)} aria-pressed={looping} aria-label={looping?'Matikan looping video':'Aktifkan looping video'} title={looping?'Loop ON — setelah selesai, video mulai lagi dari awal':'Loop OFF — klik agar video otomatis berulang'}><Repeat2 size={19}/><span>Loop {looping?'ON':'OFF'}</span></button>
        <button type="button" className="controlIcon" onClick={()=>player.current?.requestFullscreen()} aria-label="Tampilkan fullscreen"><Maximize2 size={20}/></button>
      </div>
      <button type="button" className="productionToggle" aria-controls="production-tools" onClick={()=>document.getElementById('production-tools')?.scrollIntoView({behavior:'smooth',block:'start'})}>
        <Layers3 size={16}/> Timeline Produksi &amp; Edit Video
      </button>
    </section>
    <section className="productionSection" id="production-tools" aria-label="Timeline Produksi dan alat penyuntingan video">
      <div className="timelinePanel presentationTimeline"><div className="sectionTop timelineHeading"><div><h2><Layers3 size={19}/> Timeline Produksi</h2><span>Klik segmen untuk meninjau gerak kamera dan perubahan pola partikel.</span></div><span className="timelineEnd">07 SEKUENS</span></div>
        <div className="timelineTrackWrap"><div className="trackLabel"><Film size={17}/> VIDEO <span>204 DETIK</span></div><div className="timelineTrack">{SECTIONS.map(s=><button type="button" key={s.id} title={`${s.title} — ${timer(s.start)}`} className={`timelineBlock ${statusText.id===s.id?'selected':''}`} style={{width:`${s.duration/DURATION*100}%`,'--block':s.color} as React.CSSProperties} onClick={()=>goTo(s.start)}><span>{s.short}</span></button>)}<div className="playHead" style={{left:`${frame/(DURATION*FPS)*100}%`}}/></div></div>
        <div className="timelineTrackWrap"><div className="trackLabel"><Music2 size={17}/> AUDIO <span>MUSIK + SFX</span></div><div className="audioTrack"><div className="audioWave">{Array.from({length:75},(_,i)=><i key={i} style={{height:`${15+(Math.sin(i*2.31)+1)*18+(i%6)*3}%`}}/>)}</div><div className="playHead" style={{left:`${frame/(DURATION*FPS)*100}%`}}/></div></div>
        <div className="timelineTicks">{[0,30,60,90,120,150,180,204].map(t=><button key={t} type="button" onClick={()=>goTo(t)}>{timer(t)}</button>)}</div>
      </div>
      <nav className="productionNav" aria-label="Alat produksi">{NAV.map(({id,label,icon:Icon})=><button type="button" key={id} className={`productionNavButton ${panel===id?'active':''}`} onClick={()=>setPanel(id)}><Icon size={19}/>{label}</button>)}</nav>
      <aside className="editor productionEditor">
        <div className="editorTop"><h2>{NAV.find(n=>n.id===panel)?.label}</h2>{panel==='cast'&&<p className="editorSubhead">Ganti foto, nama, dan jabatan pimpinan universitas, dekanat, pengelola program studi, atau wali kelas.</p>}</div>
      {panel==='scenes'&&<div className="editorContent"><p className="panelIntro">Setiap adegan terhubung melalui kamera, bukan pergantian slide.</p><div className="sceneList">{SECTIONS.map((s,i)=><button type="button" className={`sceneItem ${statusText.id===s.id?'active':''}`} key={s.id} onClick={()=>goTo(s.start)}><div className="sceneDot" style={{background:s.color}}>{String(i+1).padStart(2,'0')}</div><div><strong>{s.title}</strong><small>{timer(s.start)}–{timer(s.start+s.duration)}</small></div><ChevronRight size={16}/></button>)}</div><div className="infoCard"><Aperture size={20}/><div><strong>Continuous Camera</strong><p>Latar bergerak sepanjang video. Transition bertumpang tindih agar tidak ada layar kosong.</p></div></div></div>}
      {panel==='cast'&&<div className="editorContent"><div className="castTitle">15 FOTO ASLI <span>4 kelompok</span></div><div className="castGrid">{props.people.map(p=><button type="button" className={`castRow castButton ${selectedPersonId===p.id?'castActive':''}`} key={p.id} onClick={()=>setSelectedPersonId(p.id)}><img src={p.image} alt=""/><div><strong>{p.name}</strong><small>{p.role}</small></div><ChevronRight size={16}/></button>)}</div>{selectedPerson&&<div className="personEditor"><div className="personEditorHead"><img src={selectedPerson.image} alt={selectedPerson.name}/><div><strong>Ubah Profil</strong><span>{selectedPerson.short}</span></div></div><div className="settingGroup"><label>NAMA LENGKAP & GELAR</label><textarea rows={3} value={selectedPerson.name} onChange={e=>updatePerson(selectedPerson.id,{name:e.target.value})}/></div><div className="settingGroup"><label>JABATAN</label><textarea rows={2} value={selectedPerson.role} onChange={e=>updatePerson(selectedPerson.id,{role:e.target.value})}/></div><div className="settingGroup"><label>KETERANGAN JABATAN</label><textarea rows={2} value={selectedPerson.detail} onChange={e=>updatePerson(selectedPerson.id,{detail:e.target.value})}/></div><label className="fileButton"><CloudUpload size={17}/> Ganti foto (.jpg/.png/.webp)<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)uploadPhoto(f,selectedPerson.id);e.target.value='';}}/></label></div>}<div className="infoCard"><ShieldCheck size={20}/><div><strong>Aset terjaga</strong><p>15 berkas asli disertakan di folder sources/originals; website memakai versi WebP yang lebih ringan. Perubahan tersimpan di konfigurasi jika Anda mengunduh JSON.</p></div></div></div>}
      {panel==='stats'&&<div className="editorContent"><div className="statsHero"><span>DATA PLOTING PPG • UIN SUNAN KALIJAGA</span><strong>{thousands(props.stats.total)}</strong><small>data ploting PPG</small></div><div className="settingGroup"><label>JENIS KELAMIN</label>{props.stats.gender.map(g=><div className="metricRow" key={g.label}><span>{g.label}</span><strong>{thousands(g.value)}</strong><em>{g.percent}%</em></div>)}</div><div className="settingGroup"><label>8 MATA PELAJARAN</label>{props.stats.subjects.map(s=><div className="metricBar" key={s.label}><div><span>{s.label}</span><b>{thousands(s.value)}</b></div><div className="barBackground"><i style={{width:`${s.value/(props.stats.subjects[0]?.value||1)*100}%`}}/></div></div>)}</div><div className="settingGroup"><label>PROVINSI TEMPAT TUGAS</label>{props.stats.provinces.map(p=><div className="metricRow" key={p.label}><span>{p.label}</span><strong>{thousands(p.value)}</strong></div>)}</div><p className="disclaimer">{props.stats.disclaimer}</p><label className="uploadButton"><CloudUpload size={19}/><div><strong>{uploading?'Memproses...':'Unggah Excel terbaru'}</strong><small>Kolom: Jenis Kelamin, Mapel, Provinsi Tempat Tugas, Status Pegawai</small></div><input type="file" accept=".xlsx" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)uploadExcel(f);e.target.value='';}}/></label></div>}
      {panel==='audio'&&<div className="editorContent"><div className="audioHero"><Music2 size={26}/><div><strong>Original Cinematic Score</strong><span>03:24 • Orkestra sintetis orisinal</span></div></div><div className="settingGroup"><div className="toggleRow"><label>MUSIK LATAR</label><button type="button" aria-label="Musik aktif" className={`toggle ${props.musicEnabled?'on':''}`} onClick={()=>update('musicEnabled',!props.musicEnabled)}><span/></button></div><div className="rangeInfo"><span>Volume musik</span><strong>{Math.round(props.musicVolume*100)}%</strong></div><input className="customRange" type="range" min="0" max="1" step="0.01" disabled={!props.musicEnabled} value={props.musicVolume} onChange={e=>update('musicVolume',Number(e.target.value))}/></div><div className="settingGroup"><div className="toggleRow"><label>SOUND EFFECTS</label><button type="button" aria-label="Efek aktif" className={`toggle ${props.sfxEnabled?'on':''}`} onClick={()=>update('sfxEnabled',!props.sfxEnabled)}><span/></button></div><div className="rangeInfo"><span>Volume efek</span><strong>{Math.round(props.sfxVolume*100)}%</strong></div><input className="customRange" type="range" min="0" max="1" step="0.01" disabled={!props.sfxEnabled} value={props.sfxVolume} onChange={e=>update('sfxVolume',Number(e.target.value))}/></div><div className="settingGroup"><label>GANTI MUSIK (MP3/WAV)</label><label className="fileButton"><CloudUpload size={17}/> Unggah musik<input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)uploadAudio(f,'music');e.target.value='';}}/></label><small>{props.musicSrc}</small></div><div className="settingGroup"><label>GANTI EFEK SUARA (MP3/WAV)</label><label className="fileButton"><CloudUpload size={17}/> Unggah SFX<input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)uploadAudio(f,'sfx');e.target.value='';}}/></label><small>{props.sfxSrc}</small></div><div className="infoCard"><Headphones size={21}/><div><strong>Sinkron ke frame</strong><p>Musik dan efek menggunakan dua audio track berdurasi 204 detik yang diputar langsung di komposisi Remotion.</p></div></div></div>}
      {panel==='export'&&<div className="editorContent"><p className="panelIntro">Hasil video menggunakan komposisi yang sama dengan pratinjau.</p><div className="settingGroup"><label>RESOLUSI OUTPUT</label><div className="qualityGrid"><button className={quality==='fullhd'?'chosen':''} onClick={()=>setQuality('fullhd')}><strong>Full HD</strong><small>1920 × 1080</small></button><button className={quality==='hd'?'chosen':''} onClick={()=>setQuality('hd')}><strong>HD</strong><small>1280 × 720</small></button></div></div><div className="exportDetails"><div><span>Format</span><strong>MP4 • H.264</strong></div><div><span>Audio</span><strong>AAC • Stereo</strong></div><div><span>Frame rate</span><strong>30 FPS</strong></div><div><span>Durasi</span><strong>03:24</strong></div></div><button className="primaryButton wide" onClick={renderVideo} disabled={busy||job?.status==='rendering'||job?.status==='bundling'}><ArrowDownToLine size={18}/>{busy?'Memulai...':'Render & Ekspor MP4'}</button>{job&&<div className="jobBox"><div><strong>{job.status==='done'?'Video siap diunduh':job.status==='error'?'Render gagal':job.status==='rendering'?'Sedang merender':job.status==='bundling'?'Menyiapkan komposisi':'Menunggu proses'}</strong><span>{Math.round(job.progress*100)}%</span></div><div className="barBackground"><i style={{width:`${Math.max(1,job.progress*100)}%`}}/></div><small>{job.message}</small>{job.status==='done'&&job.fileUrl&&<a className="downloadButton" href={job.fileUrl} download><ArrowDownToLine size={17}/> Unduh hasil MP4</a>}</div>}<div className="infoCard warning"><Info size={21}/><div><strong>Render lokal / VPS</strong><p>Ekspor full video memerlukan Node.js dan Chromium. Di Vercel, halaman editor berfungsi tetapi render panjang memerlukan worker terpisah.</p></div></div><div className="infoCard"><CheckCircle2 size={21}/><div><strong>Alternatif CLI</strong><p>Jalankan <code>npm run render:mp4</code> di server lokal/VPS untuk ekspor Full HD.</p></div></div></div>}
      {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Tutup notifikasi"><X size={15}/></button></div>}
      </aside>
    </section>
  </div>;
}
