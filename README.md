# PPG 2026 — Cinematic Motion Studio

Website **Next.js + Remotion** untuk bumper sinematik penyambutan Mahasiswa PPG 2026 di LPTK UIN Sunan Kalijaga Yogyakarta. Bukan slideshow: gerakan kamera/parallax berkelanjutan, tipografi kinetik, 15 profil berfoto, 3 logo resmi berwarna, infografis yang dianimasikan dan soundtrack + SFX orisinal.

## Apa yang sudah tersedia

- 7 segmen / total **3 menit 24 detik**, 30 FPS, **1920 × 1080** (format proyek).
- Opening dengan kalimat lengkap `SELAMAT DATANG MAHASISWA PPG 2026 DI LPTK UIN SUNAN KALIJAGA YOGYAKARTA`.
- 15 tokoh dengan foto asli yang sudah disediakan: 4 pimpinan universitas, 5 jajaran FITK termasuk Kabag TU, 2 pimpinan prodi PPG, dan 4 wali kelas.
- Ketiga logo UIN, Eco FITK, dan PPG sebagai **PNG transparan asli warna**; sumber original tidak dihapus.
- Statistik **2.000 entri** berasal dari `Copy of Infografis_Data_Ploting_15-11-2026.xlsx` (bukan Excel 1.200 entri yang lebih lama). Jenis kelamin, mata pelajaran, provinsi tempat tugas, dan status pegawai telah dihitung ulang langsung dari file.
- Musik instrumentalia sintetis **orisinal** 204 detik dan satu jalur SFX terpisah, keduanya dalam MP3. Dapat diatur volume, diaktifkan/dimatikan, atau diganti dengan unggahan MP3/WAV di server lokal.
- Preview Remotion, timeline untuk berpindah adegan, editor judul, editor nama/jabatan/foto tokoh, impor Excel baru, unggah audio, simpan/muat konfigurasi JSON, dan ekspor MP4 lewat **proses Node.js lokal/VPS**.
- Hasil MP4: H.264 + AAC stereo, opsi Full HD 1080p atau HD 720p dengan FPS tetap 30.

## Jalankan lokal

Persyaratan: **Node.js 20+**, npm, sekitar 4+ GB RAM (render Full HD yang panjang lebih nyaman dengan 8+ GB RAM), ruang disk untuk file video, dan koneksi internet saat pertama kali memasang dependensi / Chromium.

```bash
npm install
npm run dev
```

Buka **http://localhost:3000**. Klik `Putar`, gunakan `Timeline Produksi` untuk melompat antarsegmen, lalu buka panel `Foto & Tokoh` / `Statistik Excel` / `Musik & Efek` untuk menyesuaikan bahan.

Untuk memproduksi MP4 dari website secara lokal: buka `Ekspor Video`, pilih 1080p atau 720p, klik `Render & Ekspor MP4`, kemudian pantau progres dan klik `Unduh hasil MP4` setelah selesai. Jangan tutup server ketika rendering berjalan.

Jika Chromium Remotion belum terpasang:

```bash
npx remotion browser ensure
```

Alternatif render tanpa membuka website (menggunakan `DEFAULT_PROPS`):

```bash
npm run render:mp4
```

Hasilnya ada di `out/PPG2026_FullHD.mp4`. Untuk pratinjau dari Remotion Studio:

```bash
npm run studio
```

## Deploy ke Vercel

1. Ekstrak ZIP, buat repo GitHub **baru khusus proyek ini** (jangan gunakan repo aplikasi lain), unggah seluruh source kecuali `node_modules`, `.next`, dan `out`.
2. Import repo di Vercel sebagai Next.js. Jalankan build default `npm run build`.
3. Website pratinjau, kontrol visual, dan tampilan data akan berfungsi. **Ekspor video panjang serta upload foto/audio ke penyimpanan lokal tidak tersedia pada Vercel serverless**: `/api/render` dan `/api/assets/upload` sengaja mengembalikan penjelasan yang jelas. Untuk ekspor dari web setelah deployment, sediakan rendering worker persisten (VPS/Node.js, Remotion Lambda, Cloud Run, atau sistem render lain) dan penyimpanan objek.
4. Impor Excel via endpoint `/api/stats/import` memproses file di memori, tidak menyimpan file di server. Perubahan statistik hanya berlaku selama sesi browser hingga konfigurasi diunduh ke JSON.

### Catatan tentang data dan privasi

- **2.000 berarti entri data**, bukan pasti 2.000 individu unik, karena workbook terbaru tidak mempunyai pengenal individu yang dapat digunakan untuk deduplikasi.
- Kolom wilayah adalah **Provinsi Tempat Tugas**, bukan provinsi asal.
- Data `Status Pegawai` memang tersedia, tetapi tidak dijadikan visual utama karena 1.426 entri berstatus `Belum terisi`.
- **Periksa ejaan Wali Kelas II sebelum tayang resmi**: daftar awal `Andika Yahya Putra`, sementara label foto ditulis `Andhika Yahya`. Proyek memakai `Andika Yahya Putra, M.Or.` sesuai data daftar awal, dapat disunting pada panel tokoh.
- Jika website dideploy secara publik, foto 15 orang akan dapat diakses publik dari folder `public/media/portraits`. Pastikan izin publikasi dan kebijakan institusi sudah sesuai. Jangan memasukkan data mahasiswa pribadi ke halaman publik.

## Struktur penting

```text
src/
  app/                      Next.js App Router + API untuk render, unggah, impor Excel
  components/Studio.tsx     UI studio & kontrol interaktif
  data/project.ts           Semua tokoh, urutan adegan, waktu, setelan default
  data/stats.json           Statistik terbaru dari workbook asli
  remotion/Bumper.tsx       Seluruh animasi per frame (source preview dan MP4 sama)
  remotion/root.tsx         Komposisi Remotion PPG2026
public/media/
  logos/                    PNG dengan alpha asli warna
  portraits/                WebP teroptimasi untuk preview dan video
  audio/                    Instrumental 204 detik + SFX 204 detik
  uploads/                  Aset tambahan via editor (lokal)
sources/originals/          Seluruh file sumber yang tidak dimodifikasi
scripts/                    Utilitas preprocessing / pembangkit audio (opsional)
docs/                       Verifikasi visual logo
```

## Pengembangan lebih lanjut

Timeline durasi masing-masing segmen ditentukan di `src/data/project.ts` (`SECTIONS`). Posisi, transisi dan durasi fokus profil berada di `src/remotion/Bumper.tsx`. `StudioProps` menyamakan data editor dengan prop animasi sehingga preview dan render menggunakan satu sumber scene. Setelah mengganti durasi, pastikan total `DURATION`, rentang `SECTIONS`, jalur audio, serta jadwal efek suara diubah konsisten.

## Verifikasi pengerjaan

- Data statistik dihitung ulang menggunakan parser file Excel dan telah diperiksa semua kategori berjumlah tepat 2.000.
- File logo PNG diuji memiliki kanal alpha dan berwarna sebagaimana aset aslinya.
- Seluruh **15 gambar profil** dan **2 MP3** dipaketkan; durasi file MP3 sekitar 204 detik.
- Sintaks berkas TypeScript/TSX diperiksa dengan transpiler TypeScript tanpa kesalahan parser.
- **Batas verifikasi:** lingkungan pembuatan file tidak dapat mengakses `registry.npmjs.org`, sehingga `npm install`, `next build`, preview browser sebenarnya, dan proses render MP4 belum dapat diuji di sini. Source dibangun sesuai API Remotion yang didokumentasikan, tetapi hasil akhir perlu diuji setelah dependensi terinstal pada komputer/server Anda.

## Sumber dokumentasi teknologi

- Remotion Player: https://www.remotion.dev/docs/player
- Remotion output scale: https://www.remotion.dev/docs/options/scale
- Remotion rendering: https://www.remotion.dev/docs/render
- Remotion audio: https://www.remotion.dev/docs/media/audio
