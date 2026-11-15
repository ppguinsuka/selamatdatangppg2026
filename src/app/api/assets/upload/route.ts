import {NextResponse} from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  if(process.env.VERCEL)return NextResponse.json({error:'Unggahan audio ke penyimpanan lokal tidak tersedia di Vercel. Gunakan server Node/VPS atau storage persisten.'},{status:503});
  try{
    const form=await request.formData();const file=form.get('file');
    if(!(file instanceof File))return NextResponse.json({error:'Pilih audio terlebih dahulu.'},{status:400});
    const ext=path.extname(file.name).toLowerCase();
    const isPhoto=form.get('kind')==='photo';
    const allowed=isPhoto?['.jpg','.jpeg','.png','.webp']:['.mp3','.wav'];
    if(!allowed.includes(ext))return NextResponse.json({error:isPhoto?'Foto harus PNG, JPG, atau WebP.':'Audio harus MP3 atau WAV.'},{status:400});
    if(file.size>(isPhoto?15:25)*1024*1024)return NextResponse.json({error:isPhoto?'Foto maksimal 15 MB.':'Audio maksimal 25 MB.'},{status:413});
    const dir=path.join(process.cwd(),'public','media','uploads');
    await fs.mkdir(dir,{recursive:true});
    const name=`${isPhoto?'portrait':'audio'}-${randomUUID().slice(0,14)}${ext}`;
    await fs.writeFile(path.join(dir,name),Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({url:`/media/uploads/${name}`});
  }catch(e){return NextResponse.json({error:'Upload gagal: '+(e instanceof Error?e.message:'Kesalahan server')},{status:500});}
}
