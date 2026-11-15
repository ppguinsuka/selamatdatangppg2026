"""Build derived production media from original files. Originals are preserved in sources/originals."""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageOps
import numpy as np
import shutil, json, collections, os
from artifact_tool import Blob, SpreadsheetFile
ROOT=Path(__file__).resolve().parents[1]
ORIG=ROOT/'sources/originals'; LOGO=ROOT/'public/media/logos'; PERSON=ROOT/'public/media/portraits'; DATA=ROOT/'src/data'
SRC=Path(os.environ.get('PPG_ASSETS_DIR',str(Path('/mnt/data') if (Path('/mnt/data')/'image.png').exists() else ORIG)))
ALT={'image.png':'logo_uin_original.png','IMG_3347.PNG':'logo_eco_fitk_original.PNG','Gemini_Generated_Image_zaoiqazaoiqazaoi.jpeg':'logo_ppg_original.jpg','Copy of Infografis_Data_Ploting_15-11-2026.xlsx':'Statistik_Ploting_15-11-2026.xlsx'}
def get_input(name):
 p=SRC/name
 return p if p.exists() else SRC/ALT.get(name,name)
def copy_if_different(a,b):
 if a.resolve()!=b.resolve(): shutil.copy2(a,b)
files={
'rektor':'Potret Pria Jawa Berseragam Adat elegan.png',
'wr1':'04_wanita_hijab_biru_3d.png','wr2':'02_pria_peci_3d.png','wr3':'03_pria_jas_abu_3d.png',
'dekan':'Gambar ChatGPT 15 Nov 2026, 16.42.14-10.png',
'wd1':'Gambar ChatGPT 15 Nov 2026, 16.42.12-8.png',
'wd2':'Gambar ChatGPT 15 Nov 2026, 16.42.06-1.png',
'wd3':'Gambar ChatGPT 15 Nov 2026, 16.42.07-2.png',
'kabag':'Gambar ChatGPT 15 Nov 2026, 16.42.13-9(1).png',
'kaprodi':'Gambar ChatGPT 15 Nov 2026, 16.42.08-3.png',
'sekprodi':'Gambar ChatGPT 15 Nov 2026, 16.42.08-4.png',
'wali1':'Gambar ChatGPT 15 Nov 2026, 16.42.10-6.png',
'wali2':'Gambar ChatGPT 15 Nov 2026, 16.42.11-7.png',
'wali3':'Gambar ChatGPT 15 Nov 2026, 16.42.09-5.png',
'wali4':'Potret Profesional Hijab Hitam elegan.png'
}
for key, name in files.items():
    copy_if_different(get_input(name),ORIG/name)
    im=Image.open(get_input(name)).convert('RGB')
    im.thumbnail((1122,1402),Image.Resampling.LANCZOS)
    im.save(PERSON/(key+'.webp'),format='WEBP',quality=89,method=6)
    print('profile:',key,(PERSON/(key+'.webp')).stat().st_size)
copy_if_different(get_input('image.png'),ORIG/'logo_uin_original.png')
copy_if_different(get_input('IMG_3347.PNG'),ORIG/'logo_eco_fitk_original.PNG')
copy_if_different(get_input('Gemini_Generated_Image_zaoiqazaoiqazaoi.jpeg'),ORIG/'logo_ppg_original.jpg')

def transparent_png(src, out, mode):
    im=Image.open(src).convert('RGB')
    a=np.array(im,dtype=np.float32)
    mn=a.min(2); mx=a.max(2); sat=mx-mn; gray=a.mean(2)
    if mode=='uin':
        # Nearly white source. Dark ink and saturated brand color remain opaque.
        alpha=np.maximum(np.clip((220-gray)/28,0,1),np.clip((sat-14)/26,0,1))
        alpha=np.where((gray>220)&(sat<14),0,alpha)
    else:
        # Checkerboard is greyscale around 224/255; green and black text are kept.
        alpha=np.maximum(np.clip((205-gray)/36,0,1),np.clip((sat-12)/32,0,1))
        alpha=np.where((gray>210)&(sat<12),0,alpha)
    alpha=(np.clip(alpha,0,1)*255).astype('uint8')
    image=np.dstack((np.asarray(im),alpha))
    final=Image.fromarray(image,'RGBA')
    bounds=final.getbbox()
    if bounds:final=final.crop(bounds)
    final.save(out,optimize=True)
    print('logo:',out.name,final.size)
transparent_png(get_input('image.png'),LOGO/'uin-transparan.png','uin')
transparent_png(get_input('Gemini_Generated_Image_zaoiqazaoiqazaoi.jpeg'),LOGO/'ppg-transparan.png','ppg')
eco=Image.open(get_input('IMG_3347.PNG')).convert('RGBA'); box=eco.getbbox()
if box:eco=eco.crop(box)
eco.save(LOGO/'eco-fitk-transparan.png',optimize=True)
print('logo: eco-fitk', eco.size)

# Read actual latest workbook, not the 1200-row older data.
w=SpreadsheetFile.import_xlsx(Blob.load(str(get_input('Copy of Infografis_Data_Ploting_15-11-2026.xlsx'))))
sheet=w.worksheets.get_item('Data')
raw=sheet.get_range('A1:D2001').values
headers=list(raw[0]); rows=raw[1:]
assert headers==['Jenis Kelamin','Mapel','Provinsi Tempat Tugas','Status Pegawai'],headers
assert len(rows)==2000,len(rows)
counts=[]
for col in range(4):
    c=collections.Counter(str(r[col] or 'Belum terisi').strip() for r in rows)
    counts.append([{'label':k,'value':v,'percent':round(v*100/len(rows),2)} for k,v in c.most_common()])
    assert sum(x['value'] for x in counts[-1])==len(rows)
summary={'source':'Copy of Infografis_Data_Ploting_15-11-2026.xlsx','sheet':'Data',
         'disclaimer':'Jumlah entri pada Excel terbaru; tidak dapat memastikan individu unik tanpa pengenal.',
         'total':len(rows),'gender':counts[0],'subjects':counts[1],'provinces':counts[2],'employment':counts[3]}
(DATA/'stats.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
copy_if_different(get_input('Copy of Infografis_Data_Ploting_15-11-2026.xlsx'),ORIG/'Statistik_Ploting_15-11-2026.xlsx')
print('STATS:',json.dumps(summary,ensure_ascii=False)[:1400])
