# PATCH TAMPILAN IMERSIF & PARTIKEL BERUBAH BENTUK — PPG 2026

## Yang berubah

Hanya **tiga file aplikasi** (relative terhadap root repo GitHub `ppguinsuka/selamatdatangppg2026`):

1. `src/components/Studio.tsx` — tampilan utama diganti menjadi pemutar besar; hapus Control Center/Pengaturan, label Proyek Aktif/Ruang Kerja, bagian promosi/empat ringkasan, serta galeri Identitas Visual Resmi. Timeline, editor foto/statistik/audio dan ekspor MP4 tetap ada di **Buka alat produksi** (ditutup secara default).
2. `src/remotion/Bumper.tsx` — menghapus teks kuning kecil `UNIVERSITAS ISLAM NEGERI SUNAN KALIJAGA` di opening, tulisan dekoratif berulang `PENDIDIKAN PROFESI GURU · 2026` pada profil, dan penghitung `TOKOH`; menambahkan partikel dengan morphing bentuk antar 7 segmen.
3. `src/app/globals.css` — gaya pemutar berukuran viewport, kontrol minimal, dan alat produksi opsional.

## Partikel setiap segmen

- Opening: galaksi/spiral
- Pimpinan Universitas: orbit konsentris
- FITK: tiga daun geometris
- Kaprodi & Sekprodi: heliks ganda
- Wali Kelas: empat lingkaran
- Statistik: batang data
- Penutup: mandala bintang

Perubahan bentuk dan warnanya memakai fungsi interpolasi berbasis frame Remotion selama 3,6 detik di sekitar setiap batas segmen. Tidak menggunakan animasi random berbeda antar-render. Suara dan durasi tidak diubah.

## Cara menerapkan PATCH

1. Ekstrak ZIP di komputer.
2. Pertahankan struktur folder `src/...` yang ada di ZIP.
3. Ganti ketiga file tersebut di root repositori GitHub yang sama, pada path identik.
4. Commit ke branch `main`. Jika Vercel terintegrasi, perubahan memicu build berikutnya secara otomatis.
5. Buka website, klik **Putar bumper**, dan amati perubahan bentuk partikel pada perpindahan adegan.

File foto asli, logo resmi PNG, data statistik terbaru 2.000 entri, dua file audio, API dan konfigurasi Next.js **tidak diubah** oleh patch ini. Nama dan jabatan 15 tokoh **tetap tampil** untuk menjaga fungsi sambutan; yang dihapus hanya label repetitif `TOKOH` dan teks hias terkait.

## Catatan pengujian

- Sintaks TypeScript/TSX: lolos pemeriksaan parser TypeScript.
- Fungsi koordinat partikel: semua tujuh pola menghasilkan koordinat valid untuk 180 titik, tanpa NaN/Infinity.
- Konsistensi dibanding sumber: berkas lokal semula diverifikasi identik dengan versi GitHub sebelum revisi.
- **Belum menjalankan `npm install`, `next build`, atau rendering MP4** karena koneksi ke npm registry tidak tersedia dalam lingkungan ini. Setelah upload, periksa log build Vercel dan uji playback secara langsung.

## Jika tampilan belum berubah

Pastikan ketiga berkas di root GitHub yang benar, bukan ditambahkan sebagai subfolder ZIP. Paksa reload browser dengan Ctrl+Shift+R atau Cmd+Shift+R, lalu periksa status deployment terakhir pada Vercel.
