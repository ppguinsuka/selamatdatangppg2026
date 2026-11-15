import {NextResponse} from 'next/server';
import {getJob} from '@/lib/renderJobs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const job=getJob(id);
 if(!job)return NextResponse.json({error:'Proses tidak ditemukan. Server mungkin telah dimulai ulang.'},{status:404});
 return NextResponse.json({id:job.id,status:job.status,progress:job.progress,message:job.message,fileUrl:job.fileUrl},{headers:{'Cache-Control':'no-store'}});
}
