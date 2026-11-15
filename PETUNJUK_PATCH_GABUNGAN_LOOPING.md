# PATCH GABUNGAN — BUMPER PPG 2026 + LOOPING

**Gunakan ZIP ini saja** karena Anda belum memasang patch-patch sebelumnya ke GitHub. Paket ini meneruskan keseluruhan perbaikan dari `PPG2026_PATCH_GABUNGAN_PARTIKEL_PLOTING.zip` serta menambahkan tombol **Loop ON/OFF**.

## Isi revisi

1. Tampilan langsung ke pemutar bumper; panel promosi dan Control Center yang sebelumnya diminta dihapus tetap dihilangkan.
2. **Timeline Produksi**, **Foto & Tokoh**, **Statistik Excel**, **Musik & Efek**, **Ekspor Video** tetap muncul di bawah pemutar.
3. Koreksi adegan sambutan universitas yang berulang menjadi satu judul.
4. Partikel pembentuk formasi **960 buah** + **240 bintang bergerak** yang berubah pola mengikuti tujuh segmen.
5. Angka 2.000 diberi label **data ploting PPG di UIN Sunan Kalijaga**, bukan data lapor diri. Penghilangan tulisan sumber Excel dan tanggal dari antarmuka publik.
6. **BARU: tombol Loop ON/OFF** berada di kontrol pemutar, di sebelah tombol mulai dari awal. Loop OFF (default) berhenti di akhir; Loop ON otomatis kembali ke awal dan terus memutar video beserta audionya. Status tombol terlihat; pada HP ikon tetap tampil dan status dapat diakses oleh pembaca layar.

## Pemasangan satu kali

Ekstrak ZIP. Salin keenam file `src/...` ke repositori `ppguinsuka/selamatdatangppg2026`, dengan folder yang sama, lalu commit seluruh perubahan ke `main`. Jika belum pernah memasang patch keamanan `package.json`, pastikan sudah menggunakan Next.js 15.5.29 dan React/React DOM 19.1.10 (jangan mundur ke versi rentan).

## File

- `src/components/Studio.tsx` — tampilan pemutar, panel produksi, tombol Loop
- `src/remotion/Bumper.tsx` — efek partikel dan copy video
- `src/app/globals.css` — gaya layar dan status Loop
- `src/data/project.ts` — identitas statistik di struktur adegan
- `src/data/stats.json` — statistik dan label ploting
- `src/app/api/stats/import/route.ts` — label impor Excel

Loop adalah **fitur pemutaran preview/website**; berkas MP4 yang diekspor tetap berdurasi 03:24 (204 detik) dan bisa diulang oleh aplikasi pemutarnya, tetapi tidak disisipkan sebagai video yang panjangnya tak terbatas.

Pemeriksaan yang telah dilakukan: kesesuaian pola perubahan kode, enam file dari patch gabungan, dan integritas ZIP. Build Next.js serta uji browser langsung belum dijalankan dari lingkungan ini.
