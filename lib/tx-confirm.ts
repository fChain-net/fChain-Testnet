import type { Connection, VersionedTransaction } from "@solana/web3.js"

export async function sendAndConfirmWithRetry(
  conn: Connection,
  signed: VersionedTransaction,
  opts: { maxWaitMs?: number; commitment?: "confirmed" | "finalized" } = {},
): Promise<string> {
  const maxWaitMs = opts.maxWaitMs ?? 45_000
  const commitment = opts.commitment ?? "confirmed"

  const latest = await conn.getLatestBlockhash(commitment)

  const sig = await conn.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  })

  try {
    const res = await conn.confirmTransaction(
      {
        signature: sig,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      },
      commitment,
    )
    if (res.value.err) throw new Error(JSON.stringify(res.value.err))
    return sig
  } catch (e) {
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
      const st = await conn.getSignatureStatuses([sig], { searchTransactionHistory: true })
      const v = st.value[0]
      if (v?.confirmationStatus === "confirmed" || v?.confirmationStatus === "finalized") return sig
      await new Promise((r) => setTimeout(r, 1500))
    }
    throw new Error(`Tx ${sig} not confirmed in time: ${e instanceof Error ? e.message : String(e)}`)
  }
}
