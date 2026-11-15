import {NextResponse} from 'next/server';
import type {Stats} from '@/data/project';
export const runtime='nodejs';
export const dynamic='force-dynamic';

const FIELDS=['Jenis Kelamin','Mapel','Provinsi Tempat Tugas','Status Pegawai'] as const;
const text=(v:unknown)=>String(v??'').trim();
const counts=(items:string[],len:number)=>{
 const counter=new Map<string,number>();
 for(const item of items){const label=item||'Belum terisi';counter.set(label,(counter.get(label)||0)+1);}
 return [...counter].map(([label,value])=>({label,value,percent:Number((value/len*100).toFixed(2))})).sort((a,b)=>b.value-a.value);
};

export async function POST(request:Request){
 try{
   const form=await request.formData();const file=form.get('file');
   if(!(file instanceof File))return NextResponse.json({error:'File Excel belum dipilih.'},{status:400});
   if(!file.name.toLowerCase().endsWith('.xlsx'))return NextResponse.json({error:'Hanya file .xlsx yang diterima.'},{status:400});
   if(file.size>8*1024*1024)return NextResponse.json({error:'Batas unggahan Excel adalah 8 MB.'},{status:413});
   const ExcelJS=(await import('exceljs')).default;
   const workbook=new ExcelJS.Workbook();
   await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as never);
   const sheet=workbook.getWorksheet('Data')??workbook.worksheets[0];
   if(!sheet)return NextResponse.json({error:'Workbook tidak memiliki sheet.'},{status:422});
   const headers=Array.from({length:4},(_,i)=>text(sheet.getRow(1).getCell(i+1).text));
   if(FIELDS.some((h,i)=>headers[i]!==h))return NextResponse.json({error:'Header harus sesuai: '+FIELDS.join(', ')},{status:422});
   const rows:string[][]=[];
   sheet.eachRow((row,index)=>{
     if(index===1)return;
     const r=Array.from({length:4},(_,i)=>text(row.getCell(i+1).text));
     if(r.some(Boolean))rows.push(r);
   });
   if(!rows.length)return NextResponse.json({error:'Tidak ada baris data untuk diolah.'},{status:422});
   const total=rows.length;
   const stats:Stats={
     source:file.name,sheet:sheet.name,
     disclaimer:'Jumlah entri pada Excel terbaru; tidak dapat memastikan individu unik tanpa pengenal.',
     total,
     gender:counts(rows.map(r=>r[0]),total),
     subjects:counts(rows.map(r=>r[1]),total),
     provinces:counts(rows.map(r=>r[2]),total),
     employment:counts(rows.map(r=>r[3]),total),
   };
   return NextResponse.json({stats});
 }catch(e){return NextResponse.json({error:'Gagal membaca Excel: '+(e instanceof Error?e.message:'Kesalahan tidak diketahui')},{status:500});}
}
