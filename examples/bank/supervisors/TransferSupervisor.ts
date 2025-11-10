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

/**
 * Supervisor for TransferCoordinator actor.
 *
 * Handles transfer coordination failures with appropriate recovery strategies.
 * - Resume for account lookup failures, validation errors, deposit failures
 * - Restart for state corruption or unexpected errors
 */
export class TransferSupervisor extends DefaultSupervisor {
  protected decideDirective(
    error: Error,
    _supervised: Supervised,
    _strategy: SupervisionStrategy
  ): SupervisionDirective {
    const message = error.message.toLowerCase()

    // Account not found errors - Resume (coordinator state is valid, external issue)
    if (message.includes('account not found') || message.includes('not registered')) {
      console.log(`[TransferSupervisor] Account lookup failure - resuming coordinator`)
      return SupervisionDirective.Resume
    }

    // Transfer validation errors - Resume (coordinator state is valid)
    if (message.includes('must be positive') || message.includes('same account')) {
      console.log(`[TransferSupervisor] Transfer validation error - resuming coordinator`)
      return SupervisionDirective.Resume
    }

    // Deposit failures after retries - Resume (already handled by refund logic)
    if (message.includes('max retries') || message.includes('deposit failed')) {
      console.log(`[TransferSupervisor] Deposit failure (handled by refund) - resuming coordinator`)
      return SupervisionDirective.Resume
    }

    // State corruption or unexpected errors - Restart coordinator
    console.log(`[TransferSupervisor] Unexpected error: ${error.message} - restarting coordinator`)
    return SupervisionDirective.Restart
  }
}
