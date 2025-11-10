// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

/**
 * Interface for components that can be started.
 *
 * Used by actors and other lifecycle-managed components
 * to perform initialization after construction.
 */
export interface Startable {
  /**
   * Starts the component.
   * Called after construction to perform async initialization.
   * @returns Promise that resolves when start completes
   */
  start(): Promise<void>
}