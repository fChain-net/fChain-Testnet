import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export const runtime = "nodejs"

function toHttpFromIpfs(u?: string) {
  if (!u) return u
  return u.startsWith("ipfs://") ? u.replace("ipfs://", "https://ipfs.io/ipfs/") : u
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const name = body.name ?? body.tokenData?.name
    const symbol = body.symbol ?? body.tokenData?.symbol
    const description = body.description ?? body.tokenData?.description ?? ""
    const imageUrlRaw = body.imageUrl ?? body.tokenData?.imageUrl ?? ""
    const mint = body.mint ?? body.pumpFunData?.mint ?? body.mintPubkey ?? ""
    const devWallet = body.devWallet ?? body.creator ?? body.wallet ?? ""

    if (!name || !symbol || !mint || !devWallet || !imageUrlRaw) {
      console.error("[projects/create] missing fields", {
        name,
        symbol,
        mint,
        devWallet,
        imageUrlRaw,
        bodyKeys: Object.keys(body || {}),
      })
      return NextResponse.json({ error: "missing_fields" }, { status: 400 })
    }

    const pumpUrl = `https://pump.fun/coin/${mint}`
    const supabase = createAdminClient()

    const { error } = await supabase.from("project_launches").insert({
      name,
      symbol,
      description,
      mint,
      dev_wallet: devWallet,
      image_url: toHttpFromIpfs(imageUrlRaw)!,
      pump_url: pumpUrl,
    })

    if (error) {
      console.error("[projects/create] db_insert_failed:", error)
      return NextResponse.json({ error: "db_insert_failed", detail: error.message }, { status: 500 })
    }

    try {
      revalidatePath("/explore")
    } catch {}

    return NextResponse.json({ ok: true, pumpUrl }, { status: 200 })
  } catch (e: any) {
    console.error("[projects/create] server_error:", e)
    return NextResponse.json({ error: "server_error", detail: String(e?.message ?? e) }, { status: 500 })
  }
}
