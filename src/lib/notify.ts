/**
 * Notification helper utility for StudentHire.
 *
 * Provides a generic `createNotification` function plus typed convenience wrappers
 * for every event type in the system.  All wrappers are **fire-and-forget** – they
 * return a promise but callers should NOT await them so that the main response is
 * never slowed down.  Errors are silently swallowed (non-critical).
 */

import { db } from '@/lib/db'
import { NotificationType, RelatedEntityType } from '@prisma/client'

// ────────────────────────────────────────────────────────────────────
// Core helper
// ────────────────────────────────────────────────────────────────────

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  relatedEntityType?: RelatedEntityType
  relatedEntityId?: string
}

export async function createNotification(params: CreateNotificationParams) {
  return db.notification.create({ data: params })
}

// ────────────────────────────────────────────────────────────────────
// Convenience wrappers (fire-and-forget – call without await)
// ────────────────────────────────────────────────────────────────────

export function notifyNewProposal(
  jobOwnerId: string,
  jobId: string,
  freelancerName: string,
  jobTitle: string,
) {
  return createNotification({
    userId: jobOwnerId,
    type: 'NEW_PROPOSAL',
    title: 'New Proposal Received',
    message: `${freelancerName} submitted a proposal for "${jobTitle}"`,
    actionUrl: `/contracts/detail?contractId=${jobId}`,
    relatedEntityType: 'JOB',
    relatedEntityId: jobId,
  }).catch(() => {})
}

export function notifyProposalStatus(
  freelancerId: string,
  proposalId: string,
  jobTitle: string,
  accepted: boolean,
) {
  return createNotification({
    userId: freelancerId,
    type: accepted ? 'PROPOSAL_ACCEPTED' : 'PROPOSAL_REJECTED',
    title: accepted ? 'Proposal Accepted!' : 'Proposal Update',
    message: accepted
      ? `Your proposal for "${jobTitle}" has been accepted!`
      : `Your proposal for "${jobTitle}" has been rejected`,
    actionUrl: `/proposals`,
    relatedEntityType: 'PROPOSAL',
    relatedEntityId: proposalId,
  }).catch(() => {})
}

export function notifyNewMessage(
  recipientId: string,
  conversationId: string,
  senderName: string,
) {
  return createNotification({
    userId: recipientId,
    type: 'NEW_MESSAGE',
    title: 'New Message',
    message: `${senderName} sent you a message`,
    actionUrl: `/messages/conversation?id=${conversationId}`,
    relatedEntityType: 'MESSAGE',
    relatedEntityId: conversationId,
  }).catch(() => {})
}

export function notifyContractCreated(
  userId: string,
  contractId: string,
  contractTitle: string,
) {
  return createNotification({
    userId,
    type: 'SYSTEM',
    title: 'New Contract Started',
    message: `Contract "${contractTitle}" has been created`,
    actionUrl: `/contracts/detail?id=${contractId}`,
    relatedEntityType: 'CONTRACT',
    relatedEntityId: contractId,
  }).catch(() => {})
}

export function notifyMilestoneUpdate(
  userId: string,
  contractId: string,
  milestoneTitle: string,
  status: 'APPROVED' | 'REJECTED' | 'SUBMITTED',
) {
  const titles: Record<string, string> = {
    APPROVED: 'Milestone Approved!',
    REJECTED: 'Milestone Needs Revision',
    SUBMITTED: 'Milestone Submitted',
  }
  const messages: Record<string, string> = {
    APPROVED: `"${milestoneTitle}" has been approved and payment released`,
    REJECTED: `"${milestoneTitle}" has been sent back for revision`,
    SUBMITTED: `"${milestoneTitle}" has been submitted for your review`,
  }
  return createNotification({
    userId,
    type: status === 'APPROVED' ? 'MILESTONE_APPROVED' : 'SYSTEM',
    title: titles[status],
    message: messages[status],
    actionUrl: `/contracts/detail?id=${contractId}`,
    relatedEntityType: 'CONTRACT',
    relatedEntityId: contractId,
  }).catch(() => {})
}

export function notifyPayment(
  userId: string,
  contractId: string,
  amount: number,
) {
  return createNotification({
    userId,
    type: 'PAYMENT_RECEIVED',
    title: 'Payment Received',
    message: `You received a payment of $${amount.toLocaleString()}`,
    actionUrl: `/contracts/detail?id=${contractId}`,
    relatedEntityType: 'CONTRACT',
    relatedEntityId: contractId,
  }).catch(() => {})
}

export function notifyReviewReceived(
  revieweeId: string,
  contractId: string,
  rating: number,
) {
  return createNotification({
    userId: revieweeId,
    type: 'NEW_REVIEW',
    title: 'New Review',
    message: `You received a ${rating}-star review`,
    actionUrl: `/contracts/detail?id=${contractId}`,
    relatedEntityType: 'CONTRACT',
    relatedEntityId: contractId,
  }).catch(() => {})
}

export function notifyReportStatus(
  reporterId: string,
  reportId: string,
  status: string,
) {
  const isResolved = status === 'RESOLVED'
  return createNotification({
    userId: reporterId,
    type: 'REPORT_STATUS',
    title: isResolved ? 'Report Resolved' : 'Report Update',
    message: isResolved
      ? 'Your report has been reviewed and resolved by the moderation team'
      : `Your report status has been updated to ${status.charAt(0) + status.slice(1).toLowerCase()}`,
    actionUrl: `/settings`,
    relatedEntityType: 'USER',
    relatedEntityId: reportId,
  }).catch(() => {})
}
