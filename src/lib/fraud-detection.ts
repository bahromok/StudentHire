import { db } from '@/lib/db'

interface FraudCheckResult {
  isSuspicious: boolean
  riskScore: number // 0-100
  reasons: string[]
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

interface FraudSignal {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  metadata: Record<string, unknown>
  riskPoints: number
}

/**
 * Assess a user's fraud risk score based on multiple signals.
 * Returns overall risk assessment without creating alerts.
 */
export async function assessUserRisk(userId: string): Promise<FraudCheckResult> {
  const signals = await gatherFraudSignals(userId)
  return aggregateSignals(signals)
}

/**
 * Check a user for fraud signals and automatically create FraudAlert
 * records for any detected suspicious patterns. Returns the newly
 * created alerts.
 *
 * Designed to be called fire-and-forget from API routes.
 */
export async function checkAndFlagUser(userId: string): Promise<unknown[]> {
  try {
    const signals = await gatherFraudSignals(userId)
    const alerts: unknown[] = []

    for (const signal of signals) {
      // Skip LOW severity — not worth alerting
      if (signal.severity === 'LOW') continue

      // Check if a PENDING alert of the same type already exists for this user
      const existing = await db.fraudAlert.findFirst({
        where: {
          userId,
          alertType: signal.type,
          status: 'PENDING',
        },
      })

      if (existing) continue // avoid duplicate pending alerts

      const alert = await db.fraudAlert.create({
        data: {
          userId,
          alertType: signal.type,
          severity: signal.severity,
          description: signal.description,
          metadata: JSON.stringify(signal.metadata),
          status: 'PENDING',
        },
      })
      alerts.push(alert)
    }

    return alerts
  } catch (error) {
    console.error('[FraudDetection] Error checking user:', userId, error)
    return []
  }
}

// ─── Signal Gathering ────────────────────────────────────────────────────────

async function gatherFraudSignals(userId: string): Promise<FraudSignal[]> {
  const [reportSignal, newAccountSignal, paymentSignal, repeatOffenderSignal] =
    await Promise.all([
      checkMultipleReports(userId),
      checkNewAccountSuspicious(userId),
      checkPaymentAnomalies(userId),
      checkRepeatOffender(userId),
    ])

  return [reportSignal, newAccountSignal, paymentSignal, repeatOffenderSignal].filter(
    (s): s is FraudSignal => s !== null
  )
}

// ─── Specific Checks ─────────────────────────────────────────────────────────

/**
 * Multiple Reports Rule: If a user receives 3+ reports within 7 days,
 * create a HIGH severity fraud alert.
 */
async function checkMultipleReports(userId: string): Promise<FraudSignal | null> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentReportCount = await db.report.count({
    where: {
      reportedUserId: userId,
      createdAt: { gte: sevenDaysAgo },
    },
  })

  if (recentReportCount >= 3) {
    return {
      type: 'MULTIPLE_REPORTS',
      severity: 'HIGH',
      description: `User has received ${recentReportCount} reports in the last 7 days`,
      metadata: { recentReportCount, periodDays: 7 },
      riskPoints: 40,
    }
  }

  if (recentReportCount >= 2) {
    return {
      type: 'MULTIPLE_REPORTS',
      severity: 'MEDIUM',
      description: `User has received ${recentReportCount} reports in the last 7 days`,
      metadata: { recentReportCount, periodDays: 7 },
      riskPoints: 20,
    }
  }

  return null
}

/**
 * New Account Aggressive Rule: If a user account is < 7 days old and
 * has submitted 10+ proposals or posted 5+ jobs, create a MEDIUM
 * severity alert.
 */
async function checkNewAccountSuspicious(userId: string): Promise<FraudSignal | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  })

  if (!user) return null

  const accountAgeDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (accountAgeDays > 7) return null

  const [proposalCount, jobCount] = await Promise.all([
    db.proposal.count({
      where: { freelancerId: userId, createdAt: { gte: user.createdAt } },
    }),
    db.job.count({
      where: { clientId: userId, createdAt: { gte: user.createdAt } },
    }),
  ])

  if (proposalCount >= 10 || jobCount >= 5) {
    return {
      type: 'RAPID_SIGNUP',
      severity: 'MEDIUM',
      description: `New account (${Math.round(accountAgeDays)}d old) with ${proposalCount} proposals and ${jobCount} jobs posted`,
      metadata: { accountAgeDays: Math.round(accountAgeDays), proposalCount, jobCount },
      riskPoints: 30,
    }
  }

  return null
}

/**
 * Payment Anomaly Rule: If a user has 3+ payment dispute reports,
 * create a HIGH severity alert.
 */
async function checkPaymentAnomalies(userId: string): Promise<FraudSignal | null> {
  const paymentDisputeCount = await db.report.count({
    where: {
      reportedUserId: userId,
      reportType: 'PAYMENT_DISPUTE',
    },
  })

  if (paymentDisputeCount >= 3) {
    return {
      type: 'PAYMENT_ANOMALY',
      severity: 'HIGH',
      description: `User has ${paymentDisputeCount} payment dispute reports`,
      metadata: { paymentDisputeCount },
      riskPoints: 45,
    }
  }

  if (paymentDisputeCount >= 2) {
    return {
      type: 'PAYMENT_ANOMALY',
      severity: 'MEDIUM',
      description: `User has ${paymentDisputeCount} payment dispute reports`,
      metadata: { paymentDisputeCount },
      riskPoints: 25,
    }
  }

  return null
}

/**
 * Repeat Offender Rule: If a user has been resolved-guilty in 2+ reports,
 * create a HIGH severity alert.
 */
async function checkRepeatOffender(userId: string): Promise<FraudSignal | null> {
  const guiltyReportCount = await db.report.count({
    where: {
      reportedUserId: userId,
      status: 'RESOLVED',
    },
  })

  if (guiltyReportCount >= 2) {
    return {
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'HIGH',
      description: `User has ${guiltyReportCount} resolved-guilty reports`,
      metadata: { guiltyReportCount },
      riskPoints: 50,
    }
  }

  return null
}

// ─── Signal Aggregation ──────────────────────────────────────────────────────

function aggregateSignals(signals: FraudSignal[]): FraudCheckResult {
  if (signals.length === 0) {
    return { isSuspicious: false, riskScore: 0, reasons: [], severity: 'LOW' }
  }

  const totalRiskPoints = signals.reduce((sum, s) => sum + s.riskPoints, 0)
  const riskScore = Math.min(100, totalRiskPoints)

  // Determine overall severity from the worst individual signal
  const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
  let worstSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
  for (const signal of signals) {
    if (severityOrder.indexOf(signal.severity) > severityOrder.indexOf(worstSeverity)) {
      worstSeverity = signal.severity
    }
  }

  return {
    isSuspicious: true,
    riskScore,
    reasons: signals.map((s) => `[${s.severity}] ${s.description}`),
    severity: worstSeverity,
  }
}
