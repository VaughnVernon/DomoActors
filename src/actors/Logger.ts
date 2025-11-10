// Copyright © 2012-2025 Vaughn Vernon. All rights reserved.
// Copyright © 2012-2025 Kalele, Inc. All rights reserved.
//
// Licensed under the Reciprocal Public License 1.5
//
// See: LICENSE.md in repository root directory
// See: https://opensource.org/license/rpl-1-5

/**
 * Logger interface for actor system logging.
 *
 * Provides fluent API for logging at different levels.
 * All methods return the logger instance for method chaining.
 *
 * Actors access the logger via `this.logger()` in their methods.
 */
export interface Logger {
  /**
   * Logs a debug message.
   * @param args Arguments to log
   * @returns This logger for chaining
   */
  debug(... args: any): Logger

  /**
   * Logs an error message.
   * @param args Arguments to log
   * @returns This logger for chaining
   */
  error(... args: any): Logger

  /**
   * Logs an info message.
   * @param args Arguments to log
   * @returns This logger for chaining
   */
  info(... args: any): Logger

  /**
   * Logs a general message.
   * @param args Arguments to log
   * @returns This logger for chaining
   */
  log(... args: any): Logger
}

/**
 * Console-based logger implementation.
 *
 * Delegates to standard console methods (console.debug, console.error, etc.).
 * Provides fluent API by returning this from all methods.
 */
class ConsoleLogger implements Logger {
  /**
   * Logs a debug message to console.
   * @param args Arguments to log
   * @returns This logger for chaining
   */
  debug(...args: any): Logger {
    console.debug(...args)
    return this
  }

  /**
   * Logs an error message to console.
   * @param args Arguments to log
   * @returns This logger for chaining
   */
  error(...args: any): Logger {
    console.error(...args)
    return this
  }

  /**
   * Logs an info message to console.
   * @param args Arguments to log
   * @returns This logger for chaining
   */
  info(...args: any): Logger {
    console.info(...args)
    return this
  }

  /**
   * Logs a general message to console.
   * @param args Arguments to log
   * @returns This logger for chaining
   */
  log(...args: any): Logger {
    console.log(...args)
    return this
  }
}

/**
 * Default logger instance used by the actor system.
 * Uses ConsoleLogger implementation.
 */
export const DefaultLogger = new ConsoleLogger()