import {randomUUID} from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import type {StudioProps} from '@/data/project';

export type Job={id:string;status:'queued'|'bundling'|'rendering'|'done'|'error';progress:number;message:string;output?:string;fileUrl?:string;startedAt:number};
const globalJobs=globalThis as typeof globalThis & {__ppgRenderJobs?:Map<string,Job>};
export const jobs=globalJobs.__ppgRenderJobs??(globalJobs.__ppgRenderJobs=new Map<string,Job>());
export const makeJob=()=>{const id=randomUUID();const job:Job={id,status:'queued',progress:0,message:'Menunggu worker',startedAt:Date.now()};jobs.set(id,job);return job;};
export const getJob=(id:string)=>jobs.get(id);

export async function renderJob(job:Job,props:StudioProps,quality:'hd'|'fullhd'){
 try{
  job.status='bundling';job.progress=.01;job.message='Menyiapkan komposisi Remotion';
  const [{bundle},{selectComposition,renderMedia}]=await Promise.all([import('@remotion/bundler'),import('@remotion/renderer')]);
  const bundleLocation=await bundle({entryPoint:path.resolve(process.cwd(),'src/remotion/index.ts'),webpackOverride:config=>config});
  job.progress=.055;job.message='Menemukan komposisi PPG2026';
  const composition=await selectComposition({serveUrl:bundleLocation,id:'PPG2026',inputProps:props});
  const outdir=path.join(os.tmpdir(),'ppg2026-cinematic-render');await fs.mkdir(outdir,{recursive:true});
  const output=path.join(outdir,`${job.id}.mp4`);
  job.status='rendering';job.message='Merender semua frame dengan audio';
  await renderMedia({
   serveUrl:bundleLocation,composition,codec:'h264',audioCodec:'aac',
   outputLocation:output,inputProps:props,scale:quality==='hd'?2/3:1,
   concurrency:Math.max(1,Math.min(4,Number(process.env.RENDER_CONCURRENCY)||2)),
   onProgress:({progress})=>{job.progress=.06+.94*progress;job.message=`Render ${Math.round(progress*100)}% • ${Math.round(progress*composition.durationInFrames)} frame`;},
  });
  job.output=output;job.progress=1;job.status='done';job.message='Video MP4 dengan audio berhasil dibuat';job.fileUrl=`/api/render/${job.id}/file`;
 }catch(e){job.status='error';job.message=e instanceof Error?e.message:String(e);}
}
