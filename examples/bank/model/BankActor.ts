// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

import { Actor, Protocol, Definition } from 'domo-actors'
import { AccountType, AccountInfo, TransferResult, Transaction, PendingTransfer } from '../types.js'
import { Account, Bank, TransferCoordinator } from './BankTypes.js'
import { AccountActor } from './AccountActor.js'
import { TransferCoordinatorActor } from './TransferCoordinatorActor.js'

/**
 * Bank actor implementation.
 *
 * Root coordinator that:
 * - Creates and manages account actors
 * - Maintains a transfer coordinator for all transfers
 * - Routes operations to appropriate child actors
 */
export class BankActor extends Actor implements Bank {
  private accounts = new Map<string, Account>()
  private transferCoordinator!: TransferCoordinator
  private nextAccountNumber = 1

  constructor() {
    super()
  }

  async beforeStart(): Promise<void> {
    // Create long-lived transfer coordinator as child actor
    const coordinatorProtocol: Protocol = {
      type: () => 'TransferCoordinator',
      instantiator: () => ({
        instantiate: () => new TransferCoordinatorActor()
      })
    }

    const coordinatorDefinition = new Definition(
      'TransferCoordinator',
      this.address(),  // Not used, stage generates new address
      []
    )

    this.transferCoordinator = this.childActorFor<TransferCoordinator>(
      coordinatorProtocol,
      coordinatorDefinition
    )

    this.logger().log('Bank initialized with TransferCoordinator')
  }

  async openAccount(
    owner: string,
    accountType: AccountType,
    initialBalance: number
  ): Promise<string> {
    if (Number.isNaN(initialBalance) || initialBalance < 0) {
      throw new Error('Initial balance must be positive monetary value')
    }

    const accountId = this.generateAccountId()

    // Create account actor as child
    const accountProtocol: Protocol = {
      type: () => 'Account',
      instantiator: () => ({
        instantiate: (definition: Definition) => {
          const params = definition.parameters()
          return new AccountActor(
            params[0],  // accountId
            params[1],  // owner
            params[2],  // accountType
            params[3]   // initialBalance
          )
        }
      })
    }

    const accountDefinition = new Definition(
      'Account',
      this.address(),  // Not used, stage generates new address
      [accountId, owner, accountType, initialBalance]
    )

    const account = this.childActorFor<Account>(accountProtocol, accountDefinition)

    // Register with bank and transfer coordinator
    this.accounts.set(accountId, account)
    await this.transferCoordinator.registerAccount(accountId, account)

    this.logger().log(
      `Account opened: ${accountId} (${owner}, ${accountType}, $${initialBalance.toFixed(2)})`
    )

    return accountId
  }

  async account(accountId: string): Promise<Account | undefined> {
    return this.accounts.get(accountId)
  }

  async accountSummary(accountId: string): Promise<AccountInfo | undefined> {
    const account = this.accounts.get(accountId)
    if (!account) {
      return undefined
    }
    return account.getInfo()
  }

  async accountBalance(accountId: string): Promise<number | undefined> {
    const account = this.accounts.get(accountId)
    if (!account) {
      return undefined
    }
    return account.getBalance()
  }

  async allAccounts(): Promise<AccountInfo[]> {
    const infos: AccountInfo[] = []
    for (const account of this.accounts.values()) {
      infos.push(await account.getInfo())
    }
    return infos
  }

  async transfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number
  ): Promise<TransferResult> {
    if (amount <= 0) {
      return {
        success: false,
        error: 'Transfer amount must be positive'
      }
    }

    if (fromAccountId === toAccountId) {
      return {
        success: false,
        error: 'Cannot transfer to the same account'
      }
    }

    if (!this.accounts.has(fromAccountId)) {
      return {
        success: false,
        error: `Source account not found: ${fromAccountId}`
      }
    }

    if (!this.accounts.has(toAccountId)) {
      return {
        success: false,
        error: `Destination account not found: ${toAccountId}`
      }
    }

    try {
      const transactionId = await this.transferCoordinator.initiateTransfer(
        fromAccountId,
        toAccountId,
        amount
      )

      return {
        success: true,
        transactionId
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  }

  async transactionHistory(accountId: string, limit?: number): Promise<Transaction[]> {
    const account = this.accounts.get(accountId)
    if (!account) {
      throw new Error(`Account not found: ${accountId}`)
    }
    return account.getHistory(limit)
  }

  async pendingTransfers(): Promise<PendingTransfer[]> {
    return this.transferCoordinator.getPendingTransfers()
  }

  private generateAccountId(): string {
    const accountNumber = this.nextAccountNumber++
    return `ACC${accountNumber.toString().padStart(6, '0')}`
  }
}
