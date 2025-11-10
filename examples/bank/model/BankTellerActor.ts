// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

import { Actor } from 'domo-actors'
import { AccountType } from '../types.js'
import {
  Bank,
  BankTeller,
  OpenAccountRequest,
  DepositRequest,
  WithdrawalRequest,
  TransferRequest,
  AccountSummaryRequest,
  TransactionHistoryRequest
} from './BankTypes.js'

/**
 * BankTeller actor implementation.
 *
 * Demonstrates "let it crash" philosophy:
 * - Throws errors for invalid input (NaN, undefined, null, etc.)
 * - Supervisor catches errors and displays appropriate messages
 * - Actor continues processing after supervisor resumes it
 */
export class BankTellerActor extends Actor implements BankTeller {
  constructor(private bank: Bank) {
    super()
  }

  async openAccount(request: OpenAccountRequest): Promise<string> {
    // Parse and validate - throw on error (let it crash!)
    const initialBalance = parseFloat(request.initialBalance)

    const accountType = request.accountType.toLowerCase()

    const type = accountType === 'savings' ? AccountType.Savings : AccountType.Checking

    const accountId = await this.bank.openAccount(request.owner.trim(), type, initialBalance)

    return `✅ Account opened successfully with account id: ${accountId}`
  }

  async deposit(request: DepositRequest): Promise<number> {
    // Parse and validate - throw on error
    const amount = parseFloat(request.amount)
    if (isNaN(amount)) {
      throw new Error(`Invalid amount: "${request.amount}" is not a number`)
    }

    if (!request.accountId || request.accountId.trim() === '') {
      throw new Error('Account ID cannot be empty')
    }

    const account = await this.bank.account(request.accountId.trim())
    if (!account) {
      throw new Error(`Account not found: ${request.accountId}`)
    }

    return await account.deposit(amount)
  }

  async withdraw(request: WithdrawalRequest): Promise<number> {
    const amount = parseFloat(request.amount)
    if (isNaN(amount)) {
      throw new Error(`Invalid amount: "${request.amount}" is not a number`)
    }

    if (!request.accountId || request.accountId.trim() === '') {
      throw new Error('Account ID cannot be empty')
    }

    const account = await this.bank.account(request.accountId.trim())
    if (!account) {
      throw new Error(`Account not found: ${request.accountId}`)
    }

    return await account.withdraw(amount)
  }

  async transfer(request: TransferRequest): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    const amount = parseFloat(request.amount)
    if (isNaN(amount)) {
      throw new Error(`Invalid amount: "${request.amount}" is not a number`)
    }

    if (!request.fromAccountId || request.fromAccountId.trim() === '') {
      throw new Error('Source account ID cannot be empty')
    }

    if (!request.toAccountId || request.toAccountId.trim() === '') {
      throw new Error('Destination account ID cannot be empty')
    }

    return await this.bank.transfer(
      request.fromAccountId.trim(),
      request.toAccountId.trim(),
      amount
    )
  }

  async accountSummary(request: AccountSummaryRequest): Promise<string> {
    if (!request.accountId || request.accountId.trim() === '') {
      throw new Error('Account ID cannot be empty')
    }

    const info = await this.bank.accountSummary(request.accountId.trim())
    if (!info) {
      throw new Error(`Account not found: ${request.accountId}`)
    }

    return `
┌─────────────────────────────────────┐
│ Account: ${info.id.padEnd(24)} │
├─────────────────────────────────────┤
│ Owner:   ${info.owner.padEnd(24)} │
│ Type:    ${info.type.padEnd(24)} │
│ Balance: $${info.balance.toFixed(2).padEnd(23)}│
│ Created: ${info.createdAt.toISOString().substring(0, 19).padEnd(23)}│
└─────────────────────────────────────┘`
  }

  async transactionHistory(request: TransactionHistoryRequest): Promise<string> {
    if (!request.accountId || request.accountId.trim() === '') {
      throw new Error('Account ID cannot be empty')
    }

    const limit = request.limit ? parseInt(request.limit) : undefined
    if (request.limit && isNaN(limit!)) {
      throw new Error(`Invalid limit: "${request.limit}" is not a number`)
    }

    const history = await this.bank.transactionHistory(request.accountId.trim(), limit)

    if (history.length === 0) {
      return 'No transactions found'
    }

    let result = `\nShowing ${history.length} transaction(s):\n\n`

    for (const tx of history) {
      result += `┌─────────────────────────────────────────────────────────┐\n`
      result += `│ ID:          ${tx.id.padEnd(42)} │\n`
      result += `│ Type:        ${tx.type.padEnd(42)} │\n`
      result += `│ Amount:      $${tx.amount.toFixed(2).padEnd(41)}│\n`
      result += `│ Balance:     $${tx.balance.toFixed(2).padEnd(41)}│\n`
      result += `│ Timestamp:   ${tx.timestamp.toISOString().substring(0, 19).padEnd(42)}│\n`
      result += `│ Description: ${tx.description.padEnd(42)} │\n`
      if (tx.refundReason) {
        result += `│ Refund:      ${tx.refundReason.substring(0, 42).padEnd(42)} │\n`
      }
      result += `└─────────────────────────────────────────────────────────┘\n\n`
    }

    return result
  }

  async allAccounts(): Promise<string> {
    const accounts = await this.bank.allAccounts()

    if (accounts.length === 0) {
      return 'No accounts found'
    }

    let result = `\nFound ${accounts.length} account(s):\n\n`

    for (const info of accounts) {
      result += `┌─────────────────────────────────────┐\n`
      result += `│ ${info.id.padEnd(35)} │\n`
      result += `│ Owner:   ${info.owner.padEnd(25)}│\n`
      result += `│ Type:    ${info.type.padEnd(25)}│\n`
      result += `│ Balance: $${info.balance.toFixed(2).padEnd(24)}│\n`
      result += `└─────────────────────────────────────┘\n\n`
    }

    return result
  }

  async pendingTransfers(): Promise<string> {
    const pending = await this.bank.pendingTransfers()

    if (pending.length === 0) {
      return 'No pending transfers'
    }

    let result = `\nFound ${pending.length} pending transfer(s):\n\n`

    for (const transfer of pending) {
      result += `┌──────────────────────────────────────────────────────┐\n`
      result += `│ Transaction: ${transfer.transactionId.padEnd(36)} │\n`
      result += `│ From:        ${transfer.fromAccountId.padEnd(36)} │\n`
      result += `│ To:          ${transfer.toAccountId.padEnd(36)} │\n`
      result += `│ Amount:      $${transfer.amount.toFixed(2).padEnd(35)}│\n`
      result += `│ Status:      ${transfer.status.padEnd(36)} │\n`
      result += `│ Withdrawn:   ${transfer.withdrawnAt.toISOString().substring(0, 19).padEnd(36)}│\n`
      result += `│ Attempts:    ${(transfer.attempts || 0).toString().padEnd(36)} │\n`
      result += `└──────────────────────────────────────────────────────┘\n\n`
    }

    return result
  }
}
