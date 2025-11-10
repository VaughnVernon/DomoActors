// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

/**
 * Factory interface for creating actor addresses.
 *
 * Implementations provide both constructor and static factory method
 * for generating unique addresses.
 */
export interface AddressFactory {
  /**
   * Constructs a new address instance.
   */
  new (): Address

  /**
   * Generates a unique address.
   * @returns A newly created unique address
   */
  unique(): Address
}

/**
 * Unique identifier for an actor within the actor system.
 *
 * Addresses are immutable and must provide equality comparison and hashing.
 * Implementations include NumericAddress (sequential IDs) and KsuidAddress
 * (K-Sortable Unique IDentifiers).
 *
 * Used for actor lookup in the directory and message routing.
 */
export interface Address {
  /**
   * Returns the address value with generic type.
   * @returns The underlying address value
   */
  value<T>(): T

  /**
   * Returns the address as a string.
   * @returns String representation of the address value
   */
  valueAsString(): string

  /**
   * Compares this address with another for equality.
   * @param other Address to compare with
   * @returns true if addresses are equal, false otherwise
   */
  equals(other: Address): boolean

  /**
   * Returns a hash code for this address.
   * Used for efficient storage and lookup in hash-based collections.
   * @returns Hash code integer
   */
  hashCode(): number

  /**
   * Returns a string representation of this address.
   * @returns Formatted string with address details
   */
  toString(): string
}