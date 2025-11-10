  # ✅ TestKit Usage

  ## 1. ObservableState

  **File:** `src/actors/ObservableState.ts`

  **Purpose:** Enable actors to expose internal state for testing and debugging without breaking encapsulation.

  ### Complete Example

  **Step 1: Define your actor protocol**
  ```typescript
  import { ActorProtocol } from '@/actors/ActorProtocol'

  interface Counter extends ActorProtocol {
    increment(): Promise<void>
    currentValue(): Promise<number>
  }
  ```

  **Step 2: Implement actor with ObservableStateProvider**
  ```typescript
  import { Actor } from '@/actors/Actor'
  import { ObservableState, ObservableStateProvider } from '@/actors/ObservableState'

  class CounterActor extends Actor implements Counter, ObservableStateProvider {
    private count = 0
    private incrementMessages = 0

    async increment(): Promise<void> {
      this.count++
      this.incrementMessages++
    }

    async currentValue(): Promise<number> {
      return this.count
    }

    // Expose state for testing
    async observableState(): Promise<ObservableState> {
      return new ObservableState()
        .putValue('count', this.count)
        .putValue('incrementMessages', this.incrementMessages)
    }
  }
  ```

  **Step 3: Create Protocol**
  ```typescript
  import { Protocol, ProtocolInstantiator } from '@/actors/Protocol'
  import { Definition } from '@/actors/Definition'

  const CounterProtocol: Protocol = {
    instantiator(): ProtocolInstantiator {
      return {
        instantiate(_definition: Definition): Actor {
          return new CounterActor()
        }
      }
    },
    type(): string {
      return 'Counter'
    }
  }
  ```

  **Step 4: Use in tests**
  ```typescript
  import { stage } from '@/actors/Stage'
  import { awaitObservableState } from '@/actors/testkit/TestAwaitAssist'

  it('should increment counter', async () => {
    const counter = stage().actorFor<Counter & ObservableStateProvider>(CounterProtocol)

    // Call actor methods
    await counter.increment()
    await counter.increment()
    await counter.increment()

    // Inspect internal state
    const state = await counter.observableState()

    expect(state.valueOf('count')).toBe(3)
    expect(state.valueOf('incrementMessages')).toBe(3)
  })

  it('should wait for async processing', async () => {
    const counter = stage().actorFor<Counter & ObservableStateProvider>(CounterProtocol)

    // Fire off async operations
    counter.increment()
    counter.increment()
    counter.increment()

    // Wait until state condition is met
    const state = await awaitObservableState(
      counter,
      s => s.valueOf('count') === 3,
      { timeout: 1000 }
    )

    expect(state.valueOf('incrementMessages')).toBe(3)
  })
  ```

  ### Key Principles

  - ✅ **Return snapshots, not references** - Use `[...array]` or `{...object}` to copy
  - ✅ **Opt-in pattern** - Only add ObservableStateProvider when testing that actor
  - ✅ **No production impact** - Interface ignored at runtime if not used
  - ✅ **Expose what matters** - Choose which state to reveal for tests

  ### ObservableState API

  ```typescript
  class ObservableState {
    putValue(name, value): ObservableState       // Fluent chaining
    valueOf<T>(name): T                          // Generic typing
    valueOfOrDefault<T>(name, default): T        // Safe access
    hasValue(name): boolean                      // Existence check
    size(): number                               // Count values
    keys(): string[]                             // All keys
    clear(): void                                // Reset
    snapshot(): Record<string, any>              // Debug/logging
  }
  ```

  ---
  ## 2. TestDeadLettersListener

  File: `src/actors/testkit/TestDeadLettersListener.ts`

  Problem: Only stored 1 dead letter (overwrote previous ones!)
  Solution: Now stores all dead letters in an array

  API:

  ``` TS
  class TestDeadLettersListener {
    handle(deadLetter)                          // Implementation
    count(): number                             // Total captured
    all(): DeadLetter[]                         // All letters
    latest(): DeadLetter | undefined            // Most recent
    first(): DeadLetter | undefined             // First one
    clear(): void                               // Reset
    findByRepresentation(pattern): DeadLetter[] // Search
    hasDeadLetters(): boolean                   // Any captured?
  }
  ```

  ---
  ## 3. Test Await Assist

  File: `src/actors/testkit/TestAwaitAssist.ts`

  Eliminates setTimeout() hacks in tests!

  ``` TS
  // Wait for state condition
  await awaitObservableState(
    actor,
    state => state.valueOf('count') === 5,
    { timeout: 1000, interval: 50 }
  )

  // Wait for specific value
  await awaitStateValue(actor, 'status', 'ready', { timeout: 500 })

  // Wait for assertion to pass
  await awaitAssert(async () => {
    const count = await actor.getCount()
    expect(count).toBe(10)
  }, { timeout: 2000 })
  ```

  ---
  ### 4. Comprehensive Example Test 📚

  File: `tests/actors/ObservableState.test.ts`

  19 tests demonstrating:
  - ObservableState API usage
  - ObservableStateProvider implementation pattern
  - Test utilities (awaitObservableState, awaitStateValue, awaitAssert)
  - Real-world testing patterns
  - State snapshot isolation
  - Integration with normal protocol methods

  ---
  Test Results

  ✓ All 202 tests passing (19 new ObservableState tests)
  ✓ No breaking changes to existing tests
  ✓ TestDeadLettersListener bug fixed

  ---
  Key Architectural Insights

  1. ObservableStateProvider is superior to TestProbe for DomoActors because:
    - Domain-driven, not test-driven design
    - Tests outcomes (state), not just interactions
    - No forced parent-child relationships
    - Opt-in pattern, zero production impact
  2. Removed initialization method - unnecessary complexity:
    - xoom-actors needs it for Java Memory Model synchronization
    - DomoActors doesn't (single-threaded event loop)
    - Simpler API with just observableState()
  3. Moved to production source - not just testing:
    - Can be used for debugging/monitoring
    - Domain actors choose to expose state
    - Clean separation from test infrastructure

  ---
  Usage Example

  ``` TS
  class WorkerActor extends Actor implements Worker, ObservableStateProvider {
    private processedCount = 0
    private items: string[] = []

    async observableState(): Promise<ObservableState> {
      return new ObservableState()
        .putValue('processedCount', this.processedCount)
        .putValue('items', [...this.items])  // Copy, don't expose internal!
    }
  }

  // In tests:
  const worker = stage().actorFor<Worker & ObservableStateProvider>(WorkerProtocol)

  worker.process(1)
  worker.process(2)
  worker.process(3)

  const state = await awaitObservableState(
    worker,
    s => s.valueOf('processedCount') === 3
  )

  expect(state.valueOf('items')).toEqual([1, 2, 3])
  ```

  The test palooza is about to begin! 🎉