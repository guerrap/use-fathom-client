#!/usr/bin/env node

import "dotenv/config";
import ora from "ora";
import { findUp } from "find-up";
import { mkdir, readFile, writeFile } from "fs/promises";
import { generateTypes } from "./utils/generate-types.js";
import { FathomRestClient } from "../src/clients/fathom-rest-client.js";
import { generateMappings } from "./utils/generate-mappings.js";
import { generateUtilities } from "./utils/generate-utilities.js";

/**
 * Syncronize the local events with the Fathom remote site by creating any new
 * events existing locally but missing on the remote, and by generating any new
 * events on Fathom but missing locally.
 *
 * @param siteId Site id of Fathom.
 * @param apiKey Authorization token of Fathom API.
 */
const syncEvents = async (siteId, apiKey) => {
  try {
    if (!siteId) throw new Error("missing siteId");
    if (!apiKey) throw new Error("missing apiKey");

    // Locate the configuration file
    const locationSpinner = ora();
    locationSpinner.start("Locating configuration");

    const sourcePath = await findUp("src", { type: "directory" });
    const configurationPath = await findUp([".fathomrc", ".fathomrc.json"]);
    if (!configurationPath) {
      locationSpinner.fail("Could not locate a fathom configuration file");
      throw new Error("missing fathom configuration file");
    }

    locationSpinner.succeed(
      `Configuration file located in ${configurationPath}`
    );

    // Parse the configuration file
    const configurationSpinner = ora();
    configurationSpinner.start("Reading configuration");

    const configurationFile = await readFile(configurationPath, {
      encoding: "utf-8",
    });
    const configuration = JSON.parse(configurationFile);
    if (!configuration.events) {
      configurationSpinner.fail("Could not parse .fathom.json, malformed file");
      throw new Error("malformed .fathom.json file");
    }

    configurationSpinner.succeed("Configuration parsed");

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
      throw new Error(error);
    }

    // Generate output files
    const outputSpinner = ora();
    outputSpinner.start("Generating output files");

    const outDir = configuration.outDir;
    const outputDirectory = outDir
      ? `${sourcePath}/${outDir.replaceAll(/(^\/+|\/+$)/g)}`
      : `${sourcePath}/out/fathom`;

    try {
      await mkdir(`${outputDirectory}`, { recursive: true });
      await writeFile(
        `${outputDirectory}/types.ts`,
        generateTypes(syncedEvents)
      );
      await writeFile(
        `${outputDirectory}/mappings.ts`,
        generateMappings(syncedEvents)
      );
      await writeFile(
        `${outputDirectory}/utilities.ts`,
        generateUtilities(syncedEvents)
      );
      await writeFile(
        configurationPath,
        JSON.stringify(
          {
            ...configuration,
            events: syncedEvents.map((syncedEvent) => syncedEvent.name),
          },
          null,
          2
        )
      );
      outputSpinner.succeed("Output files generated");
    } catch (error) {
      outputSpinner.fail("Could not generate output files");
      throw new Error(error);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

syncEvents(process.env.FATHOM_SITE_ID, process.env.FATHOM_API_KEY);
