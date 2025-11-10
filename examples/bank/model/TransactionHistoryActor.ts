// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

import { Actor } from 'domo-actors'
import { Transaction } from '../types.js'
import { TransactionHistory } from './BankTypes.js'

/**
 * Transaction history actor implementation.
 *
 * Demonstrates self-messaging pattern:
 * - recordTransaction() sends to self.appendTransaction()
 * - All state modifications go through the mailbox
 */
export class TransactionHistoryActor extends Actor implements TransactionHistory {
  private transactions: Transaction[] = []
  private self!: TransactionHistory

  async beforeStart(): Promise<void> {
    // Get self-proxy for async self-messaging
    this.self = this.selfAs<TransactionHistory>()
  }

  async recordTransaction(transaction: Transaction): Promise<void> {
    // Self-send to append transaction (async via mailbox)
    await this.self.appendTransaction(transaction)
  }

  async appendTransaction(transaction: Transaction): Promise<void> {
    // Message handler - state change via mailbox
    this.transactions.push(transaction)
    this.logger().log(
      `Transaction recorded: ${transaction.type} $${transaction.amount.toFixed(2)} ` +
      `(Balance: $${transaction.balance.toFixed(2)})`
    )
  }

  async getHistory(limit?: number): Promise<Transaction[]> {
    // Return newest first
    const sorted = [...this.transactions].reverse()
    return limit ? sorted.slice(0, limit) : sorted
  }

  async getBalance(): Promise<number> {
    if (this.transactions.length === 0) {
      return 0
    }
    // Balance is stored in the most recent transaction
    const lastTransaction = this.transactions[this.transactions.length - 1]
    return lastTransaction ? lastTransaction.balance : 0
  }
}
