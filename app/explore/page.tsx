import Image from "next/image"
import { createClient } from "@/lib/supabase/server"

export const revalidate = 60 // or 0 during testing

function short(s: string) {
  return s.slice(0, 4) + "…" + s.slice(-4)
}

export default async function ExplorePage() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("projects")
    .select("name, symbol, description, image_url, mint, pump_url, dev_wallet, created_at")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return <div className="p-6">Failed to load projects: {error.message}</div>
  if (!data?.length) return <div className="p-6 text-sm text-gray-500">No projects yet.</div>

  return (
    <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.map((p) => (
        <a
          key={p.mint}
          href={p.pump_url}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border p-4 hover:shadow-md transition"
          title="View on Pump.fun"
        >
          <div className="flex items-start gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-gray-100">
              <Image src={p.image_url || "/placeholder.svg"} alt={p.name} fill sizes="48px" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">
                {p.name} <span className="text-gray-500">({p.symbol})</span>
              </div>
              <div className="text-xs text-gray-500 truncate">
                {short(p.mint)} · dev {short(p.dev_wallet)}
              </div>
              <div className="text-[11px] text-gray-500">{new Date(p.created_at).toLocaleString()}</div>
              {p.description && <div className="mt-1 text-xs line-clamp-2 text-gray-700">{p.description}</div>}
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
