// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

import {
  DefaultSupervisor,
  SupervisionDirective,
  SupervisionStrategy,
  Supervised
} from 'domo-actors'

import { failureExplanation } from './FailureInformation'

/**
 * Supervisor for Bank actor.
 *
 * Handles bank-level failures with appropriate recovery strategies.
 * - Resume for validation errors, account lookup failures, child actor issues
 * - Restart for state corruption or unexpected errors
 */
export class BankSupervisor extends DefaultSupervisor {
  constructor() {
    super()
  }

  async inform(error: Error, supervised: Supervised): Promise<void> {
    // Access the ExecutionContext from the supervised actor's environment
    const executionContext = supervised.actor().lifeCycle().environment().getCurrentMessageExecutionContext()
    const command = executionContext.getValue<string>('command') || 'unknown'
    const request = executionContext.getValue<any>('request') || undefined

    const explained = failureExplanation(command, request)

    console.log('****************************************************')
    console.log(`*** ${explained}`)
    console.log('****************************************************')

    // Print context-aware error message
    console.error(`\n❌ Error in ${command}: ${error.message}\n`)

    // Call parent to apply the directive
    await super.inform(error, supervised)
  }

  protected decideDirective(
    error: Error,
    supervised: Supervised,
    _strategy: SupervisionStrategy
  ): SupervisionDirective {
    // Always Resume - the bank actor's state is fine,
    // it just received invalid input. Resume to handle next command.
    return SupervisionDirective.Resume
  }
}
