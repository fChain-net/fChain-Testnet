"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Wallet } from "lucide-react"

export function WalletButton() {
  const { connected, publicKey } = useWallet()

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </div>
        <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90" />
      </div>
    )
  }

  return (
    <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90">
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </WalletMultiButton>
  )
}
