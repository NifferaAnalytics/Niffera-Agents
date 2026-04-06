import React, { useEffect, useState } from "react"

interface AssetOverviewPanelProps {
  assetId: string
  apiBase?: string
}

interface AssetOverview {
  name: string
  priceUsd: number
  supply: number
  holders: number
  marketCapUsd?: number
  updatedAt?: string
}

export const AssetOverviewPanel: React.FC<AssetOverviewPanelProps> = ({
  assetId,
  apiBase = "/api/assets",
}) => {
  const [info, setInfo] = useState<AssetOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchInfo() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${apiBase}/${assetId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: AssetOverview = await res.json()
        if (!cancelled) setInfo(json)
      } catch (err: any) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchInfo()
    return () => {
      cancelled = true
    }
  }, [assetId, apiBase])

  if (loading) return <div className="p-4">Loading asset overview...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  if (!info) return <div className="p-4">No data available.</div>

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Asset Overview</h2>
      <p>
        <strong>ID:</strong> {assetId}
      </p>
      <p>
        <strong>Name:</strong> {info.name}
      </p>
      <p>
        <strong>Price (USD):</strong> ${info.priceUsd.toFixed(4)}
      </p>
      <p>
        <strong>Circulating Supply:</strong> {info.supply.toLocaleString()}
      </p>
      <p>
        <strong>Holders:</strong> {info.holders.toLocaleString()}
      </p>
      {info.marketCapUsd !== undefined && (
        <p>
          <strong>Market Cap:</strong> ${info.marketCapUsd.toLocaleString()}
        </p>
      )}
      {info.updatedAt && (
        <p className="text-sm text-gray-500">
          Last updated: {new Date(info.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}

export default AssetOverviewPanel
