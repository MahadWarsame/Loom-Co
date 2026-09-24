import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCategories, useProducts } from "../lib/queries";
import { ProductCard } from "../components/ProductCard";

export function Shop() {
  const [params,setParams]=useSearchParams(); const categorySlug=params.get("cat")??undefined; const q=params.get("q")??"";
  const [color,setColor]=useState<string|undefined>(); const [material,setMaterial]=useState<string|undefined>();
  const {data:categories}=useCategories(); const {data:products,isLoading}=useProducts({categorySlug,q,color,material});
  const colors=useMemo(()=>[...new Set((products??[]).map(p=>p.attributes.Color).filter(Boolean))].sort(),[products]);
  const materials=useMemo(()=>[...new Set((products??[]).map(p=>p.attributes.Material).filter(Boolean))].sort(),[products]);
  const categoryName=q?`Search results for “${q}”`:categories?.find(c=>c.slug===categorySlug)?.name??"All rugs";
  return <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
    <div className="border-b border-line pb-8"><form className="mb-6 flex max-w-xl gap-2" onSubmit={(e)=>{e.preventDefault(); const value=new FormData(e.currentTarget).get("q")?.toString().trim()??""; setParams(value?{q:value}:{})}}><input name="q" defaultValue={q} placeholder="Search rugs, brands, colours or materials…" className="h-11 min-w-0 flex-1 border border-line bg-bg px-3 text-sm outline-none focus:border-fg" /><button className="h-11 bg-fg px-5 text-sm text-bg">Search</button></form><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Collection</p><div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-4xl sm:text-5xl">{categoryName}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-mut">Curated rugs chosen for texture, character and timeless appeal.</p></div><span className="text-xs font-medium text-mut">{isLoading?"Loading…":`${products?.length??0} pieces`}</span></div></div>
    <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
      <aside className="self-start lg:sticky lg:top-28"><div className="mb-7 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.18em]">Filter</span>{(color||material||categorySlug||q)&&<button className="text-xs text-mut underline" onClick={()=>{setParams({});setColor(undefined);setMaterial(undefined)}}>Clear</button>}</div>
        <fieldset className="border-t border-line pt-4"><legend className="mb-3 text-sm font-medium">Category</legend><div className="space-y-1.5"><button className={`block text-sm transition hover:text-gold ${!categorySlug?"font-semibold":"text-mut"}`} onClick={()=>setParams({})}>All rugs</button>{(categories??[]).filter(c=>c.parent_id).map(c=><button key={c.id} className={`block text-sm transition hover:text-gold ${categorySlug===c.slug?"font-semibold":"text-mut"}`} onClick={()=>setParams({cat:c.slug})}>{c.name}</button>)}</div></fieldset>
        <fieldset className="mt-7 border-t border-line pt-4"><legend className="mb-3 text-sm font-medium">Color</legend><div className="space-y-2">{colors.map(c=><label key={c} className="flex cursor-pointer items-center gap-2 text-sm text-mut hover:text-fg"><input type="radio" name="color" checked={color===c} onChange={()=>setColor(color===c?undefined:c)}/>{c}</label>)}</div></fieldset>
        <fieldset className="mt-7 border-t border-line pt-4"><legend className="mb-3 text-sm font-medium">Material</legend><div className="space-y-2">{materials.map(m=><label key={m} className="flex cursor-pointer items-center gap-2 text-sm text-mut hover:text-fg"><input type="radio" name="material" checked={material===m} onChange={()=>setMaterial(material===m?undefined:m)}/>{m}</label>)}</div></fieldset>
      </aside>
      <div>{isLoading?<div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">{Array.from({length:6}).map((_,i)=><div key={i} className="aspect-[4/5] animate-pulse bg-soft"/>)}</div>:products?.length?<div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="border border-line px-6 py-20 text-center"><h2 className="text-2xl">No rugs found</h2><p className="mt-2 text-sm text-mut">Try clearing a filter and explore the full collection.</p></div>}</div>
    </div>
  </div>;
}
