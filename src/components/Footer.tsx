function WarmrugsBrand() {
  return (
    <div className="flex items-center gap-2.5 font-display text-2xl tracking-[-0.04em]">
      <span aria-hidden="true" className="relative grid h-7 w-7 place-items-center overflow-hidden rounded-[9px] bg-fg">
        <span className="absolute h-[2px] w-4 -rotate-[28deg] rounded-full bg-gold" />
        <span className="absolute h-[2px] w-4 rotate-[28deg] rounded-full bg-[#d7b77b]" />
        <span className="absolute bottom-[6px] h-[2px] w-3 rounded-full bg-[#f5ead4]" />
      </span>
      <span>warm<span className="text-gold">rugs</span></span>
    </div>
  );
}

export function Footer() {
  return <footer className="border-t border-line bg-[#f0ece3]"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10"><div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"><div><WarmrugsBrand /><p className="mt-3 max-w-xs text-sm leading-6 text-mut">Thoughtfully sourced rugs for spaces that feel like home.</p></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em]">Shop</p><div className="mt-4 text-sm text-mut"><a href="/shop" className="hover:text-fg">All rugs</a></div></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em]">Help</p><div className="mt-4 space-y-2 text-sm text-mut"><a href="/info/delivery" className="block hover:text-fg">Delivery</a><a href="/info/returns" className="block hover:text-fg">Returns</a><a href="/info/contact" className="block hover:text-fg">Contact</a></div></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em]">Warmrugs</p><div className="mt-4 space-y-2 text-sm text-mut"><a href="/info/story" className="block hover:text-fg">Our story</a><a href="/info/care" className="block hover:text-fg">Care guide</a></div></div></div><div className="mt-12 border-t border-line pt-5 text-xs text-mut">© {new Date().getFullYear()} Warmrugs. All rights reserved.</div></div></footer>;
}
