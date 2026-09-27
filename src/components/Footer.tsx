import { Link } from "react-router-dom";

function WarmRugsBrand() {
  return <img src="/warmrugs-logo.svg" alt="WarmRugs" className="h-12 w-auto max-w-[180px] object-contain object-left" />;
}

export function Footer() {
  return <footer className="border-t border-line bg-[#f0ece3]">
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div><WarmRugsBrand /><p className="mt-3 max-w-xs text-sm leading-6 text-mut">Thoughtfully sourced rugs for spaces that feel like home.</p><Link to="/shop" className="mt-5 inline-flex bg-fg px-5 py-3 text-xs font-semibold text-bg hover:bg-[#3a3731]">Shop rugs →</Link></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em]">Shop</p><div className="mt-4 space-y-2 text-sm text-mut"><Link to="/shop" className="block hover:text-fg">All rugs</Link><Link to="/shop?cat=rugs-persian" className="block hover:text-fg">Persian</Link><Link to="/shop?cat=rugs-vintage" className="block hover:text-fg">Vintage</Link><Link to="/shop?cat=rugs-modern" className="block hover:text-fg">Modern</Link></div></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em]">Help</p><div className="mt-4 space-y-2 text-sm text-mut"><Link to="/info/delivery" className="block hover:text-fg">Delivery</Link><Link to="/info/returns" className="block hover:text-fg">Returns</Link><Link to="/info/contact" className="block hover:text-fg">Contact</Link></div></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em]">Loom &amp; Co</p><div className="mt-4 space-y-2 text-sm text-mut"><Link to="/info/story" className="block hover:text-fg">Our story</Link><Link to="/info/care" className="block hover:text-fg">Care guide</Link><Link to="/checkout" className="block hover:text-fg">Checkout</Link></div></div>
      </div>
      <div className="mt-12 grid gap-3 border-t border-line pt-5 text-xs text-mut sm:grid-cols-2"><span>Secure checkout · Clear product information</span><span className="sm:text-right">© {new Date().getFullYear()} Loom &amp; Co. All rights reserved.</span></div>
    </div>
  </footer>;
}
