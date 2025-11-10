// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

/**
 * Interface for components that can be stopped.
 *
 * Used by actors and other lifecycle-managed components
 * to perform cleanup and graceful shutdown.
 */
export interface Stoppable {
  /**
   * Stops the component.
   * Called to perform cleanup and shutdown.
   * After stop, the component should not process new work.
   * @returns Promise that resolves when stop completes
   */
  stop(): Promise<void>
}