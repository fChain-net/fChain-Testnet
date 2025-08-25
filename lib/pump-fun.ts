// Pump.fun API integration
export interface PumpFunTokenData {
  name: string
  symbol: string
  description: string
  image: string
  twitter?: string
  telegram?: string
  website: string // This will be the GitHub repo URL
}

export interface PumpFunCreateResponse {
  mint: string
  bondingCurve: string
  associatedBondingCurve: string
  metadata: string
  metadataUri: string
}

export interface TokenMetadata {
  name: string
  symbol: string
  description: string
  image: string
  external_url: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
}

// Upload metadata to IPFS (using a service like Pinata or web3.storage)
export async function uploadMetadata(metadata: TokenMetadata): Promise<string> {
  try {
    // For demo purposes, we'll simulate IPFS upload
    // In production, you'd use a service like Pinata, web3.storage, or your own IPFS node
    const response = await fetch("/api/upload-metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    })

    if (!response.ok) {
      throw new Error("Failed to upload metadata")
    }

    const { uri } = await response.json()
    return uri
  } catch (error) {
    console.error("Error uploading metadata:", error)
    throw error
  }
}

// Create token on Pump.fun
export async function createPumpFunToken(
  tokenData: PumpFunTokenData,
  creatorPublicKey: string,
): Promise<{ transaction: string; tokenData: PumpFunCreateResponse }> {
  try {
    const response = await fetch("/api/pump-fun/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...tokenData,
        creator: creatorPublicKey,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to create token on Pump.fun")
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating Pump.fun token:", error)
    throw error
  }
}

// Get token info from Pump.fun
export async function getPumpFunTokenInfo(mintAddress: string) {
  try {
    const response = await fetch(`/api/pump-fun/token/${mintAddress}`)

    if (!response.ok) {
      throw new Error("Failed to fetch token info")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching token info:", error)
    throw error
  }
}
