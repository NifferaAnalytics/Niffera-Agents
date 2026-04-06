export interface AgentCapabilities {
  canAnswerProtocolQuestions: boolean
  canAnswerTokenQuestions: boolean
  canDescribeTooling: boolean
  canReportEcosystemNews: boolean
  canSimulateTransactions?: boolean
  canExplainMarketMetrics?: boolean
  canProvideHistoricalData?: boolean
}

export interface AgentFlags {
  requiresExactInvocation: boolean
  noAdditionalCommentary: boolean
  restrictedMode?: boolean
  logInteractions?: boolean
}

export interface AgentProfile {
  id: string
  name: string
  description: string
  version: string
  createdAt: string
  updatedAt: string
  capabilities: AgentCapabilities
  flags: AgentFlags
  metadata?: Record<string, unknown>
}

export const SOLANA_AGENT_PROFILE: AgentProfile = {
  id: "solana-knowledge-agent",
  name: "Solana Knowledge Agent",
  description: "Answers questions about Solana’s protocol, tokens, tooling, and ecosystem.",
  version: "1.0.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  capabilities: {
    canAnswerProtocolQuestions: true,
    canAnswerTokenQuestions: true,
    canDescribeTooling: true,
    canReportEcosystemNews: true,
    canSimulateTransactions: false,
    canExplainMarketMetrics: true,
    canProvideHistoricalData: false,
  },
  flags: {
    requiresExactInvocation: true,
    noAdditionalCommentary: true,
    restrictedMode: true,
    logInteractions: true,
  },
  metadata: {
    category: "blockchain",
    network: "solana",
    owner: "system",
  },
}
