import Image from 'next/image';
import LOGO from '@/lib/skryptee.png';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t mt-10 px-6 py-6 bg-white">
  <div className="relative max-w-7xl mx-auto flex items-center">

    {/* LEFT */}
    <Image src={LOGO} alt="Skryptee Logo" className="h-8 object-contain" />

    {/* CENTER (absolute true center) */}
    <div className="absolute left-1/2 transform -translate-x-1/2 text-center text-sm text-gray-500">
      Developed by     <Image src={LOGO} alt="Skryptee Logo" className="h-8 object-contain" />

      <div className="text-xs mt-1">© {year} All rights reserved | Mobile Track Taxi</div>
    </div>

  </div>
</footer>
  );
}