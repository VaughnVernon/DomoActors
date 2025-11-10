// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

/**
 * Internal symbols for accessing actor infrastructure.
 * These symbols should ONLY be used by library code, never by external clients.
 *
 * Using symbols prevents accidental access and makes it clear these are internal APIs.
 */

/**
 * Symbol for accessing an actor's environment.
 * Only library code should use this.
 *
 * @internal
 */
export const INTERNAL_ENVIRONMENT_ACCESS = Symbol('@@DomoActors/internalEnvironment')

/**
 * Helper type for accessing internal methods on actor proxies.
 * Library code can cast to this type to access internal infrastructure.
 *
 * @internal
 */
export interface InternalActorAccess {
  [INTERNAL_ENVIRONMENT_ACCESS]: () => any
}
