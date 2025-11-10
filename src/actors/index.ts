// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

/**
 * DomoActors - Production-ready Actor Model toolkit for TypeScript
 *
 * @packageDocumentation
 */

// Core Actor Model
export { Actor } from './Actor.js'
export { ActorProtocol } from './ActorProtocol.js'
export { Address } from './Address.js'
export { Stage, stage } from './Stage.js'
export { LocalStage } from './LocalStage.js'
export { Protocol, ProtocolInstantiator } from './Protocol.js'
export { Definition } from './Definition.js'

// Mailboxes
export { Mailbox } from './Mailbox.js'
export { ArrayMailbox } from './ArrayMailbox.js'
export { BoundedMailbox } from './BoundedMailbox.js'
export { OverflowPolicy } from './OverflowPolicy.js'

// Supervision
export {
  Supervisor,
  Supervised,
  SupervisionStrategy,
  SupervisionScope,
  SupervisionDirective,
  DefaultSupervisionStrategy
} from './Supervisor.js'
export { DefaultSupervisor } from './DefaultSupervisor.js'

// Lifecycle
export { LifeCycle } from './LifeCycle.js'

// Messaging
export { Message } from './Message.js'
export { DeadLetters, DeadLetter } from './DeadLetters.js'

// Addressing
export { Uuid7Address } from './Uuid7Address.js'

// Scheduling
export { Scheduler, Scheduled, Cancellable } from './Scheduler.js'

// Logging
export { Logger } from './Logger.js'

// Environment (primarily for advanced usage)
export { Environment } from './Environment.js'
export { ExecutionContext } from './ExecutionContext.js'

// State Management
export { ObservableState, ObservableStateProvider } from './ObservableState.js'

// TestKit - Testing utilities
export { TestDeadLettersListener } from './testkit/TestDeadLettersListener.js'
export { awaitObservableState, awaitStateValue, awaitAssert, AwaitOptions } from './testkit/TestAwaitAssist.js'
export { TestActorProtocol } from './testkit/TestTypes.js'

// Directory (advanced usage)
export { Directory, DirectoryConfig, DirectoryConfigs } from './Directory.js'
