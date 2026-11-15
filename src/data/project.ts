import originalStats from './stats.json';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 204;
export const TOTAL_FRAMES = FPS * DURATION;

export const SECTIONS = [
  {id:'opening', title:'Grand Opening', short:'Opening', start:0, duration:15, color:'#d8bc78', tag:'WELCOME'},
  {id:'university', title:'Pimpinan Universitas', short:'Universitas', start:15, duration:35, color:'#5ca6c5', tag:'LEADERSHIP'},
  {id:'fitk', title:'Dekanat & Kabag TU', short:'FITK', start:50, duration:45, color:'#58b79b', tag:'FACULTY'},
  {id:'program', title:'Kaprodi & Sekprodi', short:'Program Studi', start:95, duration:21, color:'#78a8ed', tag:'PROGRAM'},
  {id:'teachers', title:'Wali Kelas I–IV', short:'Wali Kelas', start:116, duration:33, color:'#55c6cb', tag:'MENTORS'},
  {id:'statistics', title:'Statistik Ploting PPG', short:'Statistik', start:149, duration:45, color:'#c5a8ff', tag:'DATA UNIVERSE'},
  {id:'closing', title:'Grand Closing', short:'Closing', start:194, duration:10, color:'#d8bc78', tag:'CLOSING'},
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];
export type PersonGroup = 'university' | 'fitk' | 'program' | 'teachers';
export type Person = { id:string; name:string; role:string; detail:string; group:PersonGroup; image:string; short:string };

export const PEOPLE: Person[] = [
  {id:'rektor',name:'Prof. Noorhaidi, S.Ag., M.A., M.Phil., Ph.D.',role:'Rektor',detail:'UIN Sunan Kalijaga Yogyakarta',group:'university',image:'/media/portraits/rektor.webp',short:'Rektor'},
  {id:'wr1',name:'Prof. Dr. Istiningsih, M.Pd.',role:'Wakil Rektor I',detail:'Bidang Akademik dan Pengembangan Lembaga',group:'university',image:'/media/portraits/wr1.webp',short:'WR I'},
  {id:'wr2',name:'Prof. Dr. Mochamad Sodik, S.Sos., M.Si.',role:'Wakil Rektor II',detail:'Bidang Administrasi Umum, Perencanaan dan Keuangan',group:'university',image:'/media/portraits/wr2.webp',short:'WR II'},
  {id:'wr3',name:'Prof. Dr. Abdur Rozaki, S.Ag., M.Si.',role:'Wakil Rektor III',detail:'Bidang Kemahasiswaan dan Kerja Sama',group:'university',image:'/media/portraits/wr3.webp',short:'WR III'},
  {id:'dekan',name:'Prof. Dr. Sigit Purnama, S.Pd.I., M.Pd.',role:'Dekan FITK',detail:'Fakultas Ilmu Tarbiyah dan Keguruan',group:'fitk',image:'/media/portraits/dekan.webp',short:'Dekan'},
  {id:'wd1',name:'Dr. Andi Prastowo, S.Pd.I., M.Pd.I.',role:'Wakil Dekan I',detail:'Bidang Akademik dan Kelembagaan',group:'fitk',image:'/media/portraits/wd1.webp',short:'WD I'},
  {id:'wd2',name:'Prof. Dr. Ibrahim, S.Pd., M.Pd.',role:'Wakil Dekan II',detail:'Bidang Administrasi Umum, Perencanaan dan Keuangan',group:'fitk',image:'/media/portraits/wd2.webp',short:'WD II'},
  {id:'wd3',name:'Dr. Winarti, S.Pd., M.Pd.Si.',role:'Wakil Dekan III',detail:'Bidang Kemahasiswaan dan Kerja Sama',group:'fitk',image:'/media/portraits/wd3.webp',short:'WD III'},
  {id:'kabag',name:'Ratna Eryani, S.Ag.',role:'Kepala Bagian Tata Usaha',detail:'Fakultas Ilmu Tarbiyah dan Keguruan',group:'fitk',image:'/media/portraits/kabag.webp',short:'Kabag TU'},
  {id:'kaprodi',name:'Dr. Rohmatun Lukluk Isnaini, S.Pd.I., M.Pd.I.',role:'Ketua Program Studi PPG',detail:'FITK UIN Sunan Kalijaga Yogyakarta',group:'program',image:'/media/portraits/kaprodi.webp',short:'Kaprodi'},
  {id:'sekprodi',name:'Muhamad Iskhak, S.Pd., M.Pd.',role:'Sekretaris Program Studi PPG',detail:'FITK UIN Sunan Kalijaga Yogyakarta',group:'program',image:'/media/portraits/sekprodi.webp',short:'Sekprodi'},
  {id:'wali1',name:'Nur Afiyanto Himawan, M.Pd.',role:'Wali Kelas I',detail:'PPG UIN Sunan Kalijaga Yogyakarta',group:'teachers',image:'/media/portraits/wali1.webp',short:'Kelas I'},
  {id:'wali2',name:'Andika Yahya Putra, M.Or.',role:'Wali Kelas II',detail:'PPG UIN Sunan Kalijaga Yogyakarta',group:'teachers',image:'/media/portraits/wali2.webp',short:'Kelas II'},
  {id:'wali3',name:'Ari Cahya Mawardi, M.Pd.',role:'Wali Kelas III',detail:'PPG UIN Sunan Kalijaga Yogyakarta',group:'teachers',image:'/media/portraits/wali3.webp',short:'Kelas III'},
  {id:'wali4',name:'Arifah Fauziyah, M.A.',role:'Wali Kelas IV',detail:'PPG UIN Sunan Kalijaga Yogyakarta',group:'teachers',image:'/media/portraits/wali4.webp',short:'Kelas IV'},
];

export const LOGOS = [
  {id:'uin',src:'/media/logos/uin-transparan.png',name:'UIN Sunan Kalijaga'},
  {id:'eco',src:'/media/logos/eco-fitk-transparan.png',name:'Eco FITK'},
  {id:'ppg',src:'/media/logos/ppg-transparan.png',name:'PPG UIN Sunan Kalijaga'},
] as const;
export type Stats = typeof originalStats;
export const DEFAULT_STATS: Stats = originalStats;
export type StudioProps = {
  headline: string;
  subheading: string;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicSrc: string;
  sfxSrc: string;
  stats: Stats;
  people: Person[];
};
export const DEFAULT_PROPS: StudioProps = {
  headline:'SELAMAT DATANG MAHASISWA PPG 2026',
  subheading:'DI LPTK UIN SUNAN KALIJAGA YOGYAKARTA',
  musicVolume:.72, sfxVolume:.52, musicEnabled:true, sfxEnabled:true,
  musicSrc:'/media/audio/original-score-204s.mp3',
  sfxSrc:'/media/audio/cinematic-sfx-204s.mp3',
  stats: DEFAULT_STATS,
  people: PEOPLE,
};
export const thousands = (n:number) => new Intl.NumberFormat('id-ID').format(n);
export const timer = (seconds:number) => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
