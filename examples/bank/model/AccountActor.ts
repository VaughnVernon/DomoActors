// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

import { Actor, Protocol, Definition } from 'domo-actors'
import { AccountType, AccountInfo, Transaction } from '../types.js'
import { Account, TransactionHistory } from './BankTypes.js'
import { TransactionHistoryActor } from './TransactionHistoryActor.js'

/**
 * Bank account actor implementation.
 *
 * Creates a child TransactionHistory actor to maintain audit trail.
 * Demonstrates parent-child actor relationships.
 */
export class AccountActor extends Actor implements Account {
  private balance: number
  private readonly accountId: string
  private readonly owner: string
  private readonly accountType: AccountType
  private readonly createdAt: Date
  private transactionHistory!: TransactionHistory

  constructor(accountId: string, owner: string, accountType: AccountType, initialBalance: number) {
    super()
    this.accountId = accountId
    this.owner = owner
    this.accountType = accountType
    this.balance = initialBalance
    this.createdAt = new Date()
  }

  async beforeStart(): Promise<void> {
    // Create child actor for transaction history
    const historyProtocol: Protocol = {
      type: () => 'TransactionHistory',
      instantiator: () => ({
        instantiate: () => new TransactionHistoryActor()
      })
    }

    const historyDefinition = new Definition(
      'TransactionHistory',
      this.address(),  // Not used, stage generates new address
      []
    )

    this.transactionHistory = this.childActorFor<TransactionHistory>(
      historyProtocol,
      historyDefinition
    )

    // Record initial balance
    if (this.balance > 0) {
      await this.transactionHistory.recordTransaction({
        id: `init-${this.accountId}`,
        type: 'deposit',
        amount: this.balance,
        balance: this.balance,
        timestamp: this.createdAt,
        description: 'Initial deposit'
      })
    }
  }

  async deposit(amount: number): Promise<number> {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive')
    }

    this.balance += amount

    await this.transactionHistory.recordTransaction({
      id: `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'deposit',
      amount,
      balance: this.balance,
      timestamp: new Date(),
      description: `Deposit $${amount.toFixed(2)}`
    })

    return this.balance
  }

  async withdraw(amount: number): Promise<number> {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive')
    }

    if (amount > this.balance) {
      throw new Error(`Insufficient funds. Balance: $${this.balance.toFixed(2)}, Requested: $${amount.toFixed(2)}`)
    }

    this.balance -= amount

    await this.transactionHistory.recordTransaction({
      id: `wd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'withdrawal',
      amount,
      balance: this.balance,
      timestamp: new Date(),
      description: `Withdrawal $${amount.toFixed(2)}`
    })

    return this.balance
  }

  async getBalance(): Promise<number> {
    return this.balance
  }

  async getInfo(): Promise<AccountInfo> {
    return {
      id: this.accountId,
      owner: this.owner,
      type: this.accountType,
      balance: this.balance,
      createdAt: this.createdAt
    }
  }

  async refund(amount: number, transactionId: string, reason: string): Promise<number> {
    this.balance += amount

    await this.transactionHistory.recordTransaction({
      id: `refund-${transactionId}`,
      type: 'refund',
      amount,
      balance: this.balance,
      timestamp: new Date(),
      description: `Refund for transaction ${transactionId}`,
      refundReason: reason
    })

    return this.balance
  }

  async getHistory(limit?: number): Promise<Transaction[]> {
    return this.transactionHistory.getHistory(limit)
  }
}
