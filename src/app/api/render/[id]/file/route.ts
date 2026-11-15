import {NextResponse} from 'next/server';
import {getJob} from '@/lib/renderJobs';
import fs from 'node:fs/promises';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const job=getJob(id);
 if(job?.status!=='done'||!job.output)return NextResponse.json({error:'File belum tersedia.'},{status:404});
 try{
   // For local/VPS use. Large files are read into memory; production deployment should use persistent object storage.
   const bytes=await fs.readFile(job.output);
   return new Response(bytes,{headers:{'Content-Type':'video/mp4','Content-Disposition':'attachment; filename="Bumper_PPG_2026_Cinematic_FullHD.mp4"','Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'File output tidak ditemukan.'},{status:404});}
}
