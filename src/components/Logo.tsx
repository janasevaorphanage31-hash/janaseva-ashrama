export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo/janaseva-mark.svg" alt="Janaseva Ashrama mark" width={size} height={size} className="shrink-0 rounded-full" />
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 shrink-0 select-none">
      <LogoMark />
      <span className={`leading-none tracking-wide shrink-0 ${light ? "text-white" : "text-teal-900"}`}>
        <span className="block text-[15px] sm:text-[16px] font-extrabold tracking-wide">JANASEVA</span>
        <span className={`block text-[9px] sm:text-[10px] font-bold tracking-[0.32em] ${light ? "text-gold" : "text-saffron-dark"}`}>ASHRAMA</span>
      </span>
    </span>
  );
}
