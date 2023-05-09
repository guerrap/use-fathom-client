declare module "@guerrap/use-fathom-client" {
  export interface Window {
    fathom?: Fathom;
    __fathomCommandsQueue: FathomCommand[];
  }

  export interface Fathom {
    siteId: string;
    blockTrackingForMe(): void;
    enableTrackingForMe(): void;
    trackPageview(options?: TrackPageViewOptions): void;
    trackGoal(eventId: string, cents: number): void;
    trackRegisteredGoal<T>(eventName: T, cents: number): void;
    setSite(siteId: string): void;
    isTrackingEnabled(): boolean;
  }

  export type TrackPageViewOptions = {
    url?: string;
    referrer?: string;
  };

  export type FathomCommand =
    | { type: "trackPageview"; options?: TrackPageViewOptions }
    | {
        type: "trackGoal";
        eventId: string;
        cents: number;
      }
    | {
        type: "trackRegisteredGoal";
        eventName: any;
        cents: number;
      }
    | { type: "blockTrackingForMe" }
    | { type: "enableTrackingForMe" }
    | { type: "setSite"; siteId: string };

  export interface InitializationOptions {
    src: string;
    "data-honor-dnt"?: boolean;
    "data-auto"?: boolean;
    "data-canonical"?: boolean;
    "data-excluded-domains"?: string[];
    "data-spa"?: "history" | "hash" | "auto";
  }

  export function initialize<T>(
    siteId: string,
    options: InitializationOptions,
    registeredEventsResolver?: (registeredEventName: T) => string | undefined
  ): Promise<void>;
  export function enableTrackingForMe(): void;
  export function blockTrackingForMe(): void;
  export function trackPageview(options?: TrackPageViewOptions): void;
  export function trackGoal(eventId: string, cents: number): void;
  export function trackRegisteredGoal<T>(eventName: T, cents: number): void;
  export function setSite(siteId: string): void;
  export function isTrackingEnabled(): boolean;
}
