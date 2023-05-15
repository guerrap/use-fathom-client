#!/usr/bin/env node

import "dotenv/config";
import ora from "ora";
import { findUp } from "find-up";
import { mkdir, readFile, writeFile } from "fs/promises";
import { generateTypes } from "./utils/generate-types.js";
import { FathomRestClient } from "../src/clients/fathom-rest-client.js";
import { generateMappings } from "./utils/generate-mappings.js";
import { generateUtilities } from "./utils/generate-utilities.js";
import { generatePlaceholderCode } from "./utils/generate-placeholder-code.js";
import { dirname } from "path";

/**
 * Syncronize the local events with the Fathom remote site by creating any new
 * events existing locally but missing on the remote, and by generating any new
 * events on Fathom but missing locally.
 *
 * @param siteId Site id of Fathom.
 * @param apiKey Authorization token of Fathom API.
 */
const syncEvents = async (siteId, apiKey) => {
  // Locate the configuration file
  const locationSpinner = ora();
  locationSpinner.start("Locating configuration");

  const configurationPath = await findUp([".fathomrc", ".fathomrc.json"]);
  const sourceFolder = dirname(configurationPath);
  if (!configurationPath) {
    locationSpinner.fail("Could not locate a fathom configuration file");
    console.error("missing fathom configuration file");
    process.exit(1);
  }

  locationSpinner.succeed(`Configuration file located in ${configurationPath}`);

  // Parse the configuration file
  const configurationSpinner = ora();
  configurationSpinner.start("Reading configuration");

  const configurationFile = await readFile(configurationPath, {
    encoding: "utf-8",
  });
  const configuration = JSON.parse(configurationFile);
  if (!configuration.events) {
    configurationSpinner.fail("Could not parse .fathom.json, malformed file");
    console.error("malformed .fathom.json file");
    process.exit(1);
  }

  configurationSpinner.succeed("Configuration parsed");

  // Output directory for the generated files
  const outDir = configuration.outDir;
  const outputDirectory = outDir
    ? `${sourceFolder}/${outDir.replaceAll(/(^\/+|\/+$)/g)}`
    : `${sourceFolder}/out/fathom`;

  // When the envs are missing, proceed to generate "empty" code
  if (!siteId || !apiKey) {
    ora().warn("Missing envs");
    ora().warn("Skipping event sync");

    const placeholderOutputSpinner = ora();
    placeholderOutputSpinner.start("Generating placeholder outputs");

    await mkdir(`${outputDirectory}`, { recursive: true });
    await generatePlaceholderCode(outputDirectory);
    placeholderOutputSpinner.succeed("Placeholder outputs generated");
    process.exit(0);
  }

  // Generate missing events
  const syncingSpinner = ora();
  syncingSpinner.start("Syncing fathom events");

  let syncedEvents = [];
  try {
    const apiClient = new FathomRestClient(siteId, apiKey);
    const remoteEvents = await apiClient.getSiteEvents();

    const eventsToCreate = configuration.events
      .filter((event) => !!event)
      .filter(
        (event) =>
          !remoteEvents.find((remoteEvent) => remoteEvent.name === event)
      );

    const newSiteEvents = await apiClient.postSiteEvents(eventsToCreate);
    syncedEvents = [...remoteEvents, ...newSiteEvents];

    syncingSpinner.succeed(
      `Fathom events synced: ${syncedEvents.length} events`
    );
  } catch (error) {
    syncingSpinner.fail("Could not sync fathom events");
    console.error(error);
    process.exit(1);
  }

  // Generate output files
  const outputSpinner = ora();
  outputSpinner.start("Generating output files");

  try {
    await mkdir(`${outputDirectory}`, { recursive: true });

    await generateTypes(syncedEvents, `${outputDirectory}/types.ts`);
    await generateMappings(syncedEvents, `${outputDirectory}/mappings.ts`);
    await generateUtilities(`${outputDirectory}/utilities.ts`);

    await writeFile(
      configurationPath,
      JSON.stringify(
        {
          ...configuration,
          events: syncedEvents.map((syncedEvent) => syncedEvent.name),
        },
        null,
        4
      )
    );
    outputSpinner.succeed("Output files generated");
  } catch (error) {
    outputSpinner.fail("Could not generate output files");
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
};

syncEvents(process.env.FATHOM_SITE_ID, process.env.FATHOM_API_KEY);
