// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

/**
 * Defines how a BoundedMailbox handles messages when capacity is reached.
 */
export enum OverflowPolicy {
  /**
   * Drop the oldest message in the queue to make room for the new message.
   * Useful when recent messages are more important than old ones.
   */
  DropOldest,

  /**
   * Drop the newest (incoming) message.
   * Useful when preserving message order is critical.
   */
  DropNewest,

  /**
   * Reject the new message by sending it to dead letters.
   * Useful for strict message delivery guarantees.
   */
  Reject
}
