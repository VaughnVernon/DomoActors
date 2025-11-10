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
 * Supervisor for Account and TransactionHistory actors.
 *
 * Handles account-specific failures with appropriate recovery strategies.
 * - Resume for business errors (insufficient funds, invalid amounts)
 * - Restart for state corruption or unexpected errors
 */
export class AccountSupervisor extends DefaultSupervisor {
  protected decideDirective(
    error: Error,
    _supervised: Supervised,
    _strategy: SupervisionStrategy
  ): SupervisionDirective {
    const message = error.message.toLowerCase()

    // Insufficient funds - Resume (actor state is valid, operation just failed)
    if (message.includes('insufficient funds')) {
      console.log(`[AccountSupervisor] Insufficient funds - resuming actor`)
      return SupervisionDirective.Resume
    }

    // Invalid amount (negative, zero) - Resume (actor state is valid)
    if (message.includes('must be positive') || message.includes('negative')) {
      console.log(`[AccountSupervisor] Invalid amount - resuming actor`)
      return SupervisionDirective.Resume
    }

    // State corruption or unexpected errors - Restart
    console.log(`[AccountSupervisor] Unexpected error: ${error.message} - restarting actor`)
    return SupervisionDirective.Restart
  }
}
