# Use Fathom Client

## Introduction

The Fathom Client package is designed to make it easier for developers to integrate [`Fathom Analytics`](https://usefathom.com) on a Single Page Application (SPA), where routing is done client-side.

## Features

With this package, developers can take advantage of the following key features:

- An `initialize` function to asyncronously inject the Fathom `script`
- A series of wrappers around the Fathom functions that can be called even if the Fathom script has not yet loaded
- A `prepare-fathom` script that can automatically generate Fathom events dynamically

## Installation

To install the package, run:

```sh
npm install use-fathom-client
```

## Basic usage

Once installed, Fathom can initialized with the `FATOM_SITE_ID` (obtained by registering on Fathom) and with a configuration object that must include the Fathom's script location (it should be a CDN endpoint, more details [here](https://usefathom.com/docs/script/embed)). The `initialize` function supports a third optional parameter that enhances the usage when dealing with events registerd on Fathom (more on this later).

```ts
import * as Fathom from "use-fathom-client";

Fathom.initialize("FATHOM_SITE_ID", {
  src: "FATHOM_SCRIPT",
  "data-auto": false,
  "data-spa": "auto",
});
```

After initializing, you can use the exported functions throughout your application:

```ts
import * as Fathom from "use-fathom-client";

// Track a page view
Fathom.trackPageview();
// Track a pre-registered goal
Fathom.trackGoal();
```

## Usage with event sync

### Event sync

As mentioned earlier, the library includes a `prepare-fathom` script that can automatically create event entities on the target Fathom site (using Fathom's API), given a list of event names. Since the script interacts with the Fathom API, you need to define a couple of environment variables:

- `FATHOM_SITE_ID`: the site id
- `FATHOM_API_KEY`: the API key secret

The script uses `dotenv` to read environment variables, so you'll need to create a `.env` file in the root directory of your project:

```sh
FATHOM_SITE_ID=""
FATHOM_API_KEY=""
```

Additionally, the script requires a configuration file named either `.fathomrc`, or`.fathomrc.json` as a starting point for the event definitions. This file should be in `JSON` format, placed in the root of your project, and should contain the desired event names.

```json
{
  "events": ["CUSTOM_EVENT_NAME", "ANOTHER_CUSTOM_EVENT_NAME"]
}
```

Once defined the script can be run by adding a dedicated entry to your `package.json`, like this:

```json
{
  "scripts": {
    "setup-fathom": "prepare-fathom out/mappings"
  }
}
```

The `prepare-fathom` script is designed to ensure that the events defined in the `.fathomrc` file are synchronized with those on the remote Fathom site. If any events are missing on the remote site, the script will create them automatically. On the other hand, if there are events that exist on the remote site but are not defined in the local mapping, the script will add them to the `.fathomrc` file. Once you run the `prepare-fathom` script, the `.fathomrc` file should be fully aligned with the remote site.

### Code generation

Once the events have been synchronized, the `prepare-fathom` script proceeds to generate three files under the default `out/fathom` directory (if a custom directory is not specified when executing the command). These files will be located within the `src` directory:

- `mappings.ts`: this file contains an array that includes all the registered events.
- `types.ts`: type definitions about the registered events.
- `utilities.ts`: it exports a `registeredEventsResolver` function that can be used to retrieve a registered event id by its name.

### Use the generated code

After all events have been synchronized and the code has been generated, Fathom can be initialized with the `registeredEventsResolver`, which enables the `trackRegisteredGoal` function.

```ts
import * as Fathom from "use-fathom-client";
import { registeredEventsResolver } from "./out/fathom/utilities";

Fathom.initialize(
  "FATHOM_SITE_ID",
  {
    src: "FATHOM_SCRIPT",
    "data-auto": false,
    "data-spa": "auto",
  },
  registeredEventsResolver
);
```

To import the `registeredEventsResolver`, simply reference the generated `utilities` file.

After initializing Fathom with this resolver (as shown in the example above), all exported functions can be used without issue, with the exception of `trackRegisteredGoal`. To use this function, you must first specify which events it should support.

```ts
import * as Fathom from "use-fathom-client";
import { FathomRegisteredEventName } from "./out/fathom/types";

// Track a registered goal
Fathom.trackRegisteredGoal<FathomRegisteredEventName>("", 0);
```

To import the `FathomRegisteredEventName` mapping, simply reference the generated `types` file.

With this mapping imported, you can now use the `Fathom.trackRegisteredGoal<T>` type, which supports all events defined in the configuration file.

## Delete an event

Keep in mind that if you need to delete an event, you should first remove it from the Fathom dashboard, then delete it from your local configuration file and finally run `prepare-fathom`; if the event exists either locally or remotely, it will be syncronized.
