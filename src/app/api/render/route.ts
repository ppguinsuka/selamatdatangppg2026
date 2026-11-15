import {NextResponse} from 'next/server';
import {DEFAULT_PROPS,type StudioProps} from '@/data/project';
import {makeJob,renderJob,jobs} from '@/lib/renderJobs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(process.env.VERCEL)return NextResponse.json({error:'Rendering video 3:24 tidak dapat diandalkan dalam fungsi serverless Vercel. Jalankan studio pada Node/VPS atau gunakan npm run render:mp4.'},{status:503});
 try{
   const data=await request.json();const p=data?.props;
   if(!p||typeof p.headline!=='string'||typeof p.subheading!=='string'||!p.stats||typeof p.stats.total!=='number'||!Array.isArray(p.stats.subjects)||!Array.isArray(p.people)||p.people.length!==15){
     return NextResponse.json({error:'Konfigurasi render tidak valid.'},{status:400});
   }
   // Prevent arbitrary remote URL fetches in renderer and extremely long text.
   for(const src of [p.musicSrc,p.sfxSrc])if(typeof src!=='string'||!/^\/media\/(audio|uploads)\/[a-z0-9._-]+\.(mp3|wav)$/i.test(src))return NextResponse.json({error:'Sumber audio tidak dikenal.'},{status:400});
   for(const person of p.people)if(typeof person.image!=='string'||!/^\/media\/(portraits|uploads)\/[a-z0-9._-]+\.(png|jpe?g|webp)$/i.test(person.image))return NextResponse.json({error:'Sumber foto tidak dikenal.'},{status:400});
   const props:StudioProps={...DEFAULT_PROPS,...p,headline:p.headline.slice(0,100),subheading:p.subheading.slice(0,110),musicVolume:Math.min(1,Math.max(0,Number(p.musicVolume)||0)),sfxVolume:Math.min(1,Math.max(0,Number(p.sfxVolume)||0))};
   const running=[...jobs.values()].filter(j=>['queued','bundling','rendering'].includes(j.status));
   if(running.length)return NextResponse.json({error:'Masih ada proses rendering. Tunggu sampai selesai sebelum memulai render berikutnya.'},{status:429});
   const job=makeJob();
   // Background job is maintained by long-lived Node server, never on serverless.
   setImmediate(()=>{void renderJob(job,props,data.quality==='hd'?'hd':'fullhd');});
   return NextResponse.json({id:job.id,status:job.status},{status:202});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Permintaan tidak valid.'},{status:500});}
}
