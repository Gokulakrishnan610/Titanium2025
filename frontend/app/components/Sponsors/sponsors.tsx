'use client'

import LogoLoop from "../../../components/LogoLoop";
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss } from 'react-icons/si';

const techLogos = [
  { node: <SiReact size={80} />, title: "React", href: "https://react.dev" },
  { node: <SiNextdotjs size={80} />, title: "Next.js", href: "https://nextjs.org" },
  { node: <SiTypescript size={80} />, title: "TypeScript", href: "https://www.typescriptlang.org" },
  { node: <SiTailwindcss size={80} />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
];
export default function Sponsors() {
  return ((  <div style={{ height: '300px', position: 'relative', overflow: 'hidden'}}>
      <br></br>
      <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px', color: '#fff' }}>Our Sponsors</h2>
      <br></br>
      <br></br>
      <LogoLoop logos={techLogos} speed={50} direction="left" />;
  </div>))

}
