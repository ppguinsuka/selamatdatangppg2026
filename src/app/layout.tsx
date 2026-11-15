import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata = {
 title:'PPG 2026 — Cinematic Motion Studio',
 description:'Studio bumper video penyambutan PPG 2026 UIN Sunan Kalijaga. Kinetic typography, 15 tokoh, infographic data, musik dan ekspor MP4.'
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="id"><body>{children}</body></html>;
}
