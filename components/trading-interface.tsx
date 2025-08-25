"use client"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletButton } from "@/components/wallet-button"
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react"

interface TradingInterfaceProps {
  project: any
}

export function TradingInterface({ project }: TradingInterfaceProps) {
  const { connected } = useWallet()
  const [buyAmount, setBuyAmount] = useState("")
  const [sellAmount, setSellAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const handleBuy = async () => {
    if (!connected || !buyAmount) return

    setLoading(true)
    try {
      // Simulate buy transaction
      console.log("Buying", buyAmount, "SOL worth of", project.token_symbol)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      console.error("Buy error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSell = async () => {
    if (!connected || !sellAmount) return

    setLoading(true)
    try {
      // Simulate sell transaction
      console.log("Selling", sellAmount, project.token_symbol)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      console.error("Sell error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trade ${project.token_symbol}
        </CardTitle>
        <CardDescription>Buy and sell tokens directly</CardDescription>
      </CardHeader>
      <CardContent>
        {!connected ? (
          <div className="text-center py-6">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">Connect your wallet to trade</p>
            <WalletButton />
          </div>
        ) : (
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="space-y-4">
              <div>
                <Label htmlFor="buy-amount">Amount (SOL)</Label>
                <Input
                  id="buy-amount"
                  type="number"
                  placeholder="0.1"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>

              {buyAmount && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span>You pay:</span>
                    <span>{buyAmount} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>You receive:</span>
                    <span>
                      ~{(Number.parseFloat(buyAmount) * 1000000).toLocaleString()} ${project.token_symbol}
                    </span>
                  </div>
                </div>
              )}

              <Button onClick={handleBuy} disabled={!buyAmount || loading} className="w-full">
                {loading ? "Processing..." : `Buy ${project.token_symbol}`}
              </Button>
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              <div>
                <Label htmlFor="sell-amount">Amount ({project.token_symbol})</Label>
                <Input
                  id="sell-amount"
                  type="number"
                  placeholder="1000000"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  step="1000"
                  min="0"
                />
              </div>

              {sellAmount && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span>You sell:</span>
                    <span>
                      {Number.parseFloat(sellAmount).toLocaleString()} ${project.token_symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>You receive:</span>
                    <span>~{(Number.parseFloat(sellAmount) / 1000000).toFixed(4)} SOL</span>
                  </div>
                </div>
              )}

              <Button onClick={handleSell} disabled={!sellAmount || loading} className="w-full" variant="destructive">
                {loading ? "Processing..." : `Sell ${project.token_symbol}`}
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
            <div className="text-xs text-orange-800">
              <p className="font-medium mb-1">Trading Notice</p>
              <p>
                This is a demo interface. Real trading would integrate with Pump.fun's API and require proper wallet
                signatures.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
