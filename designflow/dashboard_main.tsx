import React from "react"
import SentimentGauge from "./SentimentGauge"
import AssetOverviewPanel from "./AssetOverviewPanel"
import WhaleTrackerCard from "./WhaleTrackerCard"

export const AnalyticsDashboard: React.FC = () => (
  <div className="p-8 bg-gray-100 min-h-screen">
    <header className="mb-6">
      <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
      <p className="text-gray-600 mt-2">
        Real-time insights on sentiment, asset metrics, and whale activity
      </p>
    </header>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded shadow p-4">
        <SentimentGauge symbol="SOL" />
      </div>
      <div className="bg-white rounded shadow p-4">
        <AssetOverviewPanel assetId="SOL-01" />
      </div>
      <div className="bg-white rounded shadow p-4">
        <WhaleTrackerCard />
      </div>
    </div>
  </div>
)

export default AnalyticsDashboard
