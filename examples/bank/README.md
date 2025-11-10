# DomoActors Bank Example

A comprehensive banking system demonstrating advanced DomoActors patterns and best practices.

## Overview

This example implements a realistic banking system with accounts, transactions, and inter-account transfers. It showcases sophisticated actor model patterns including parent-child hierarchies, self-messaging, supervision strategies, and eventual consistency.

## What This Example Demonstrates

### Core Actor Patterns

1. **Parent-Child Actor Hierarchies**
   - `Bank` creates and manages `Account` and `TransferCoordinator` actors
   - `Account` creates a child `TransactionHistory` actor for audit trail
   - Proper lifecycle management with `beforeStart()` hooks

2. **Self-Messaging for State Changes**
   - All state modifications go through the mailbox using `selfAs<T>()`
   - Demonstrates proper async message flow vs direct synchronous calls
   - Example: `TransferCoordinator` sends messages to itself for each step

3. **Realistic Multi-Step Coordination**
   - Transfer flow: Withdraw → Record Pending → Deposit → Retry/Refund
   - Each step is a separate async message through the mailbox
   - Exponential backoff retry logic with scheduled messages

4. **Supervision Strategies**
   - Three supervision strategies for different actor types
   - Resume for business errors (insufficient funds, invalid amounts)
   - Restart for state corruption or unexpected errors

5. **Message-Driven Architecture**
   - No direct method calls for state changes
   - All operations flow through actor mailboxes
   - Maintains proper actor model semantics

## Actor Hierarchy

```
Bank (root)
├── TransferCoordinator (long-lived child)
│   └── Manages all pending transfers
│   └── Coordinates multi-step transfer flow
└── Account (per-account child)
    └── TransactionHistory (per-account child)
        └── Immutable transaction log
```

## Transfer Flow

The transfer coordinator implements a realistic banking transfer with intermediate states:

```
1. INITIATE
   └─> Withdraw from source account
       │
       ▼
2. RECORD PENDING (self-send)
   └─> Store pending transfer state
       │
       ▼
3. ATTEMPT DEPOSIT (self-send)
   └─> Try to deposit to destination
       │
       ├─> SUCCESS: Complete transfer (self-send)
       │
       └─> FAILURE: Handle failure (self-send)
           │
           ├─> Attempts < MAX: Retry with backoff (self-send)
           │
           └─> Max attempts: Refund to source (self-send)
```

Each arrow represents an **async message** through the mailbox, not a direct call.

## Key Features

### Self-Messaging Pattern

Traditional (incorrect):
```typescript
async recordPendingTransfer(transfer: PendingTransfer): Promise<void> {
  this.pendingTransfers.set(transfer.transactionId, transfer)  // ❌ Direct call
}
```

DomoActors (correct):
```typescript
async beforeStart(): Promise<void> {
  this.self = this.selfAs<TransferCoordinator>()  // Get proxy
}

async initiateTransfer(...): Promise<string> {
  // Self-send - goes through mailbox
  this.self.recordPendingTransfer(transfer)  // ✅ Async message

  // Another self-send
  this.self.attemptDeposit(transactionId)  // ✅ Async message
}

async recordPendingTransfer(transfer: PendingTransfer): Promise<void> {
  // Message handler - executes when message processed from mailbox
  this.pendingTransfers.set(transfer.transactionId, transfer)
}
```

### Realistic Transfer Coordination

Unlike simple examples that show atomic two-phase commits, this example demonstrates:

- **Intermediate State**: Funds are withdrawn before deposit attempt
- **Retry Logic**: Failed deposits retry with exponential backoff
- **Eventual Consistency**: Transfers may take time to complete
- **Refund Mechanism**: Failed transfers refund to source with audit trail
- **Pending Tracking**: View transfers in progress

### Supervision Strategies

#### AccountSupervisor
- **Resume** for business errors (insufficient funds, invalid amounts)
- **Restart** for unexpected errors or state corruption

#### TransferSupervisor
- **Resume** for account lookup failures, validation errors
- **Restart** for coordinator state corruption

#### BankSupervisor
- **Resume** for validation errors, delegates to child supervisors
- **Restart** for bank-level state corruption

## Running the Example

### Prerequisites

```bash
# Build DomoActors
npm install
npm run build
```

### Start the CLI

```bash
# From the DomoActors root directory
npm run example:bank
```

This will build both the library and the example, then run the bank CLI.

### Sample Session

```
🏦 Starting DomoActors Bank Example...

✅ Bank system initialized

╔════════════════════════════════════════╗
║       DomoActors Bank Example          ║
╠════════════════════════════════════════╣
║  1. Create Account                     ║
║  2. Deposit Money                      ║
║  3. Withdraw Money                     ║
║  4. Transfer Money                     ║
║  5. View Account Info                  ║
║  6. View Transaction History           ║
║  7. List All Accounts                  ║
║  8. View Pending Transfers             ║
║  9. Exit                               ║
╚════════════════════════════════════════╝

Enter choice (1-9): 1

--- Create Account ---
Owner name: Alice
Account type (checking/savings): checking
Initial balance: $1000
✅ Account created successfully: ACC000001
```

## Code Highlights

### Creating Child Actors

```typescript
// From AccountActor.ts
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
    this.address(),
    []
  )

  this.transactionHistory = this.childActorFor<TransactionHistory>(
    historyProtocol,
    historyDefinition
  )
}
```

### Retry with Exponential Backoff

```typescript
// From TransferCoordinatorActor.ts
async handleDepositFailure(transactionId: string, reason: string): Promise<void> {
  const transfer = this.pendingTransfers.get(transactionId)
  if (!transfer) return

  const attempts = (transfer.attempts || 0) + 1
  transfer.attempts = attempts

  if (attempts < MAX_RETRY_ATTEMPTS) {
    // Schedule retry with exponential backoff
    const delay = RETRY_DELAY_MS * Math.pow(2, attempts - 1)

    this.scheduler().schedule(
      { task: () => this.self.attemptDeposit(transactionId) },
      delay
    )
  } else {
    // Max retries: refund
    this.self.processRefund(transactionId, reason)
  }
}
```

### Refund with Audit Trail

```typescript
// From AccountActor.ts
async refund(amount: number, transactionId: string, reason: string): Promise<number> {
  this.balance += amount

  await this.transactionHistory.recordTransaction({
    id: `refund-${transactionId}`,
    type: 'refund',
    amount,
    balance: this.balance,
    timestamp: new Date(),
    description: `Refund for transaction ${transactionId}`,
    refundReason: reason  // Audit trail
  })

  return this.balance
}
```

## Project Structure

```
examples/bank/
├── actors/
│   ├── AccountActor.ts              # Account management
│   ├── BankActor.ts                 # Root coordinator
│   ├── TransactionHistoryActor.ts   # Immutable transaction log
│   └── TransferCoordinatorActor.ts  # Multi-step transfer coordination
├── supervisors/
│   ├── AccountSupervisor.ts         # Account error handling
│   ├── BankSupervisor.ts            # Bank error handling
│   └── TransferSupervisor.ts        # Transfer error handling
├── types.ts                         # Shared types
├── bank.ts                          # CLI interface
└── README.md                        # This file
```

## Learning Path

1. **Start with TransactionHistoryActor.ts**
   - Simple self-messaging pattern
   - Single state array
   - Good introduction to `selfAs<T>()`

2. **Move to AccountActor.ts**
   - Parent-child relationship
   - Creating child actors in `beforeStart()`
   - Business logic with validation

3. **Study TransferCoordinatorActor.ts**
   - Complex state machine
   - Multiple self-sends per operation
   - Retry logic with scheduling
   - Demonstrates why self-messaging is essential

4. **Examine BankActor.ts**
   - Root coordinator pattern
   - Managing multiple child actors
   - Delegating to child actors

5. **Review Supervision Strategies**
   - Different strategies for different error types
   - Resume vs Restart decisions
   - Error handling philosophy

## Testing Ideas

Try these scenarios to see the actor model in action:

1. **Insufficient Funds Transfer**
   - Create two accounts
   - Try to transfer more than available
   - See supervision resume the actor

2. **Concurrent Operations**
   - Make multiple deposits/withdrawals rapidly
   - All operations serialize through mailbox
   - No race conditions

3. **Pending Transfers**
   - Initiate a transfer
   - Immediately check pending transfers (option 8)
   - See intermediate state

4. **Transaction History**
   - Perform various operations
   - View complete audit trail
   - See refunds with reasons

## Key Takeaways

1. **Always use `selfAs<T>()` for state changes** - Direct calls bypass the mailbox
2. **Self-messaging enables sophisticated coordination** - Each step is a separate message
3. **Supervision strategies provide resilience** - Actors recover from errors appropriately
4. **Parent-child hierarchies organize complexity** - Each actor has clear responsibilities
5. **Message-driven architecture ensures correctness** - No race conditions, proper serialization

## Next Steps

Consider extending this example:

- Add interest calculation for savings accounts
- Implement scheduled transfers
- Add account closure with final balance transfer
- Create a second bank for inter-bank transfers
- Add persistent event sourcing

## License

Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
Copyright © 2012-2025 Kalele, Inc. All rights reserved.

Licensed under the Reciprocal Public License 1.5

See: LICENSE.md in repository root directory
See: https://opensource.org/license/rpl-1-5
