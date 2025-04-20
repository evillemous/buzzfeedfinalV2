declare module 'node-cron' {
  /**
   * Schedules a task to run on a specific schedule
   * @param cronExpression A cron expression (e.g., '0 * * * *')
   * @param task The function to execute on the schedule
   * @param options Options for the scheduled task
   */
  export function schedule(
    cronExpression: string,
    task: () => void | Promise<void>,
    options?: {
      scheduled?: boolean;
      timezone?: string;
    }
  ): {
    start: () => void;
    stop: () => void;
  };

  /**
   * Validates a cron expression
   * @param cronExpression A cron expression (e.g., '0 * * * *')
   * @returns True if the expression is valid, false otherwise
   */
  export function validate(cronExpression: string): boolean;
}