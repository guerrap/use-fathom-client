import fetch, { Headers } from "node-fetch";

export class FathomRestClient {
  constructor(siteId, apiKey) {
    this.siteId = siteId;
    this.apiKey = apiKey;
  }

  /**
   * Fetches all the existing events.
   *
   * @returns List of Fathom events.
   */
  async getSiteEvents() {
    let events = [];
    let startingAfter = "";

    const headers = new Headers({ Authorization: `Bearer ${this.apiKey}` });

    do {
      try {
        const response = await fetch(
          `https://api.usefathom.com/v1/sites/${this.siteId}/events?limit=100&starting_after=${startingAfter}`,
          {
            headers,
          }
        );
        
        if (!response.ok) {
          console.error("could not get site events from fathom", await response.text());
          process.exit(1);
        }
        
        const responseJson = await response.json();

        if (responseJson.has_more)
          startingAfter = responseJson.data[responseJson.data.length - 1].id;
        else startingAfter = "";

        events.push(...responseJson.data);
      } catch (error) {
        console.error("could not fetch fathom events", error);
        throw error;
      }
    } while (!!startingAfter);

    return events;
  }

  /**
   * Creates new events on Fathom.
   *
   * @param events List of event names to create.
   * @returns List of newly created events.
   */
  async postSiteEvents(events) {
    const headers = new Headers({
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    });

    return await Promise.all(
      events.map(async (event) => {
        const response = await fetch(
          `https://api.usefathom.com/v1/sites/${this.siteId}/events`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              name: event,
            }),
          }
        );

        if (!response.ok) {
          console.error("could not post site events to fathom", await response.text());
          process.exit(1);
        }

        const jsonResponse = await response.json();
        return jsonResponse;
      })
    );
  }
}
