/**
 * Load and initialize the fathom script.
 *
 * If the `registeredEventsResolver` param is provided, then `trackRegisteredGoal` function can be used to track registered events.\
 *
 * For more details about fathom https://usefathom.com/docs.
 *
 * @param {*} siteId Site id of Fathom.
 * @param {*} options Configuration options supported.
 * @param {*} registeredEventsResolver Optional function that given a RegisteredEventName event returns the corresponding id.
 * @returns
 */
export const initialize = (siteId, options, registeredEventsResolver) => {
  return new Promise((resolve, reject) => {
    if (!siteId) {
      console.warn("could not initilize fathom, site id missing");
      return reject("site id missing");
    }

    if (!!document.getElementById(siteId)) {
      console.warn("fathom script already injected");
      return resolve();
    }

    if (!!window.fathom) {
      console.warn("fathom already initialized");
      return resolve();
    }

    const script = document.createElement("script");
    script.setAttribute("data-site", siteId);

    if (options["data-honor-dnt"])
      script.setAttribute("data-honor-dnt", `${options["data-honor-dnt"]}`);
    if (options["data-auto"])
      script.setAttribute("data-auto", `${options["data-auto"]}`);
    if (options["data-canonical"])
      script.setAttribute("data-canonical", `${options["data-canonical"]}`);
    if (options["data-spa"])
      script.setAttribute("data-spa", `${options["data-spa"]}`);
    if (options["data-excluded-domains"])
      script.setAttribute(
        "data-excluded-domains",
        `${options["data-excluded-domains"].join(",")}`
      );

    script.onload = () => {
      window.fathom.trackRegisteredGoal = (eventName, cents) => {
        if (!registeredEventsResolver) {
          console.error("no registered events resolver configured");
          return;
        }

        const eventId = registeredEventsResolver(eventName);

        if (!eventId) {
          console.warn("can't track non existing fathom event", eventName);
          return;
        }

        window.fathom.trackGoal(eventId, cents);
      };
      flushQueue();
      resolve();
    };
    script.defer = true;
    script.src = options.src;
    script.id = siteId;
    document.head.appendChild(script);
  });
};

/**
 * Enable tracking for the current user.
 */
export const enableTrackingForMe = () => {
  if (window.fathom) window.fathom.enableTrackingForMe();
  else scheduleCommand({ type: "enableTrackingForMe" });
};

/**
 * Disable tracking for the current user.
 */
export const blockTrackingForMe = () => {
  if (window.fathom) window.fathom.blockTrackingForMe();
  else scheduleCommand({ type: "blockTrackingForMe" });
};

/**
 * Track a page view.
 *
 * @param {*} options Options supported.
 */
export const trackPageview = (options) => {
  if (window.fathom) window.fathom.trackPageview(options);
  else scheduleCommand({ type: "trackPageview", options });
};

/**
 * Track an event.
 *
 * @param {*} eventId Id of the event.
 * @param {*} cents Price associated to the event.
 */
export const trackGoal = (eventId, cents) => {
  if (window.fathom) {
    window.fathom.trackGoal(eventId, cents);
  } else scheduleCommand({ type: "trackGoal", eventId, cents });
};

/**
 * Track a registered event.
 *
 * @param {*} eventName Name of the registered event.
 * @param {*} cents Price associated to the event.
 */
export const trackRegisteredGoal = (eventName, cents) => {
  if (window.fathom) {
    window.fathom.trackRegisteredGoal(eventName, cents);
  } else scheduleCommand({ type: "trackRegisteredGoal", eventName, cents });
};

/**
 * Set the fathom site id.
 *
 * @param {*} siteId Site id of Fathom.
 */
export const setSite = (siteId) => {
  if (window.fathom) window.fathom.setSite(siteId);
  else scheduleCommand({ type: "setSite", siteId });
};

/**
 * Check of the tracking is active.
 *
 * @returns
 */
export const isTrackingEnabled = () => {
  const preferenceStorage = localStorage.getItem("blockFathomTracking");
  return preferenceStorage !== null ? preferenceStorage !== "true" : true;
};

/**
 * Schedule a command that will be executed once the fathom script has been initialized.
 *
 * @param {*} command Supported command.
 */
const scheduleCommand = (command) => {
  window.__fathomCommandsQueue = window.__fathomCommandsQueue || [];
  window.__fathomCommandsQueue.push(command);
};

/**
 * Execute all the commands in the queue.
 */
const flushQueue = () => {
  window.__fathomCommandsQueue = window.__fathomCommandsQueue || [];
  window.__fathomCommandsQueue.forEach((command) => {
    switch (command.type) {
      case "trackPageview":
        trackPageview(command.options);
        break;
      case "trackGoal":
        trackGoal(command.eventId, command.cents);
        break;
      case "trackRegisteredGoal":
        trackRegisteredGoal(command.eventName, command.cents);
        break;
      case "enableTrackingForMe":
        enableTrackingForMe();
        break;
      case "blockTrackingForMe":
        blockTrackingForMe();
        break;
      case "setSite":
        setSite(command.siteId);
        break;
    }
  });
  window.__fathomCommandsQueue = [];
};
