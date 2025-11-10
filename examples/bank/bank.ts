// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5
// one at https://mozilla.org/MPL/2.0/.

import * as readline from 'readline'
import { stage, Protocol, Definition } from 'domo-actors'
import { Bank, BankTeller, RequestType } from './model/BankTypes.js'
import { BankActor } from './model/BankActor.js'
import { BankTellerActor } from './model/BankTellerActor.js'
import { BankSupervisor } from './supervisors/BankSupervisor.js'
import { BankTellerSupervisor } from './supervisors/BankTellerSupervisor.js'

/**
 * Banking System CLI
 *
 * Interactive command-line interface demonstrating DomoActors patterns:
 * - Parent-child actor hierarchies
 * - Self-messaging for state changes
 * - Realistic multi-step transfer coordination
 * - Supervision strategies with "let it crash" philosophy
 *   - Let the teller handle validation - it will crash on invalid input
 *     and the supervisor will print the error message
 * - Message-driven architecture
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let teller: BankTeller

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve)
  })
}

async function showMenu(): Promise<void> {
  console.log('\n')
  console.log('╔════════════════════════════════════════╗')
  console.log('║       DomoActors Bank Example          ║')
  console.log('╠════════════════════════════════════════╣')
  console.log('║  1. Open Account                       ║')
  console.log('║  2. Deposit Funds                      ║')
  console.log('║  3. Withdraw Funds                     ║')
  console.log('║  4. Transfer Funds                     ║')
  console.log('║  5. Account Summary                    ║')
  console.log('║  6. Transaction History                ║')
  console.log('║  7. List All Accounts                  ║')
  console.log('║  8. Pending Transfers                  ║')
  console.log('║  9. Exit                               ║')
  console.log('╚════════════════════════════════════════╝\n')
}

async function openAccount(): Promise<void> {
  console.log('\n--- Open Account ---')
  const owner = await prompt('Owner name: ')
  const accountType = await prompt('Account type (checking/savings): ')
  const initialBalance = await prompt('Initial balance: $')

  const request = { owner, accountType, initialBalance }

  teller.executionContext().reset()
    .setValue('command', RequestType.OpenAccount)
    .setValue('request', request)

  const result = await teller.openAccount(request)

  console.log(result)
}

async function deposit(): Promise<void> {
  console.log('\n--- Deposit Funds ---')
  const accountId = await prompt('Account ID: ')
  const amount = await prompt('Amount: $')

  const request = { accountId, amount }

  teller.executionContext().reset()
    .setValue('command', RequestType.Deposit)
    .setValue('request', request)

  const newBalance = await teller.deposit(request)
  console.log(`✅ Deposit successful. New balance: $${newBalance.toFixed(2)}`)
}

async function withdraw(): Promise<void> {
  console.log('\n--- Withdraw Funds ---')
  const accountId = await prompt('Account ID: ')
  const amount = await prompt('Amount: $')

  const request = { accountId, amount }

  teller.executionContext().reset()
    .setValue('command', RequestType.Withdraw)
    .setValue('request', request)

  const newBalance = await teller.withdraw(request)
  console.log(`✅ Withdrawal successful. New balance: $${newBalance.toFixed(2)}`)
}

async function transfer(): Promise<void> {
  console.log('\n--- Transfer Funds ---')
  const fromAccountId = await prompt('From Account ID: ')
  const toAccountId = await prompt('To Account ID: ')
  const amount = await prompt('Amount: $')

  const request = { fromAccountId, toAccountId, amount }

  teller.executionContext().reset()
    .setValue('command', RequestType.Transfer)
    .setValue('request', request)

  const result = await teller.transfer(request)

  if (result.success) {
    console.log(`✅ Transfer initiated successfully`)
    console.log(`   Transaction ID: ${result.transactionId}`)
    console.log(`   Note: Transfer is processed asynchronously with retry logic`)
  } else {
    console.log(`❌ Transfer failed: ${result.error}`)
  }
}

async function accountSummary(): Promise<void> {
  console.log('\n--- Account Summary ---')
  const accountId = await prompt('Account ID: ')

  const request = { accountId }

  teller.executionContext().reset()
    .setValue('command', RequestType.AccountSummary)
    .setValue('request', request)

  const summary = await teller.accountSummary(request)
  console.log(summary)
}

async function transactionHistory(): Promise<void> {
  console.log('\n--- Transaction History ---')
  const accountId = await prompt('Account ID: ')
  const limit = await prompt('Limit (press Enter for all): ')

  const request = { accountId, limit }

  teller.executionContext().reset()
    .setValue('command', RequestType.TransactionHistory)
    .setValue('request', request)

  const history = await teller.transactionHistory(request)
  console.log(history)
}

async function allAccounts(): Promise<void> {
  console.log('\n--- All Accounts ---')

  teller.executionContext().reset()
    .setValue('command', RequestType.AllAccounts)

  const accounts = await teller.allAccounts()
  console.log(accounts)
}

async function pendingTransfers(): Promise<void> {
  console.log('\n--- Pending Transfers ---')

  teller.executionContext().reset()
    .setValue('command', RequestType.PendingTransfers)

  const pending = await teller.pendingTransfers()
  console.log(pending)
}

async function main(): Promise<void> {
  console.log('\n🏦 Starting DomoActors Bank Example...\n')

  const bankStage = stage()

  // Create supervisor actors
  const bankSupervisorProtocol: Protocol = {
    type: () => 'bank-supervisor',
    instantiator: () => ({
      instantiate: () => new BankSupervisor()
    })
  }

  const tellerSupervisorProtocol: Protocol = {
    type: () => 'teller-supervisor',
    instantiator: () => ({
      instantiate: () => new BankTellerSupervisor()
    })
  }

  // Create supervisor actors (use default supervisor for supervisors themselves)
  bankStage.actorFor(bankSupervisorProtocol, undefined, 'default')
  bankStage.actorFor(tellerSupervisorProtocol, undefined, 'default')

  // Create Bank actor
  const bankProtocol: Protocol = {
    type: () => 'Bank',
    instantiator: () => ({
      instantiate: () => new BankActor()
    })
  }

  const bank = bankStage.actorFor<Bank>(bankProtocol, undefined, 'bank-supervisor')

  // Create BankTeller actor as a child that uses the bank
  const tellerProtocol: Protocol = {
    type: () => 'BankTeller',
    instantiator: () => ({
      instantiate: (definition: Definition) => {
        const params = definition.parameters()
        return new BankTellerActor(params[0])
      }
    })
  }

  teller = bankStage.actorFor<BankTeller>(tellerProtocol, undefined, 'teller-supervisor', undefined, bank)

  console.log('✅ Bank system initialized\n')
  console.log('This example demonstrates:')
  console.log('  • Parent-child actor hierarchies')
  console.log('  • Self-messaging for state changes')
  console.log('  • Realistic multi-step transfers with retry logic')
  console.log('  • "Let it crash" supervision with error reporting')
  console.log('  • Message-driven architecture\n')

  // Main loop
  let running = true

  while (running) {
    await showMenu()
    const choice = await prompt('Enter choice (1-9): ')

    try {
      switch (choice.trim()) {
        case '1':
          await openAccount()
          break
        case '2':
          await deposit()
          break
        case '3':
          await withdraw()
          break
        case '4':
          await transfer()
          break
        case '5':
          await accountSummary()
          break
        case '6':
          await transactionHistory()
          break
        case '7':
          await allAccounts()
          break
        case '8':
          await pendingTransfers()
          break
        case '9':
          console.log('\n👋 Shutting down...')
          running = false
          break
        default:
          console.log('❌ Invalid choice. Please enter 1-9.')
      }
    } catch (error) {
      // Errors are already handled by supervision and printed
      // This catch is just to prevent the CLI from crashing
    }

    // Small delay to allow async messages to process
    if (running) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // Cleanup
  rl.close()
  console.log('✅ Bank system stopped\n')
  process.exit(0)
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Received interrupt signal')
  rl.close()
  console.log('✅ Bank system stopped\n')
  process.exit(0)
})

// Run
main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
