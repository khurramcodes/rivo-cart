declare module "node-cron" {
  export type ScheduleOptions = {
    scheduled?: boolean;
    timezone?: string;
  };

  export interface ScheduledTask {
    start: () => void;
    stop: () => void;
    destroy: () => void;
    running: boolean;
  }

  export function schedule(
    expression: string,
    func: () => void | Promise<void>,
    options?: ScheduleOptions,
  ): ScheduledTask;
}
