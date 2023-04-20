const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

const port = 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const baseUrl = "https://www.dunzo.com";

// Define the getJobDetails function globally
const getJobListings = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://www.dunzo.com/careers#jobs", {
      waitUntil: "networkidle2",
    });

    // Wait for the iframe to load
    await page.waitForSelector("#grnhse_app");

    // Switch to the iframe
    const iframeElement = await page.$("#grnhse_iframe");
    const iframe = await iframeElement.contentFrame();

    // Wait for the jobs section to load
    await iframe.waitForSelector("#content");

    const getJobDetails = async (url, iframe) => {
      try {
        console.log(url);
        const browser1 = await puppeteer.launch();
        const page1 = await browser1.newPage();

        await page1.goto(url, { waitUntil: "networkidle2" });

        // Wait for the iframe to load
        await page1.waitForSelector(".container ");

        const iframeElement1 = await page1.$("iframe#grnhse_iframe");
        const iframe1 = await iframeElement1.contentFrame();

        // Wait for the jobs section to load
        await iframe1.waitForSelector("#main");

        const selectors = [
          "#content p:last-of-type",
          ".textLayer:last strong:last-of-type",
          "#content p:last",
        ];

        const job_Description = await iframe1.$eval("#content", (el) => {
          return el.textContent;
        });

        await browser1.close();

        return {
          job_Description,
        };

        await browser1.close();

        return {
          // responsibilities,
          qualifications_skills_required,
          //iframe1
        };
      } catch (error) {
        console.error(
          `Error while fetching job details for URL: ${url}. Error: ${error.message}`
        );
        return null;
      }
    };

    const jobElements = await iframe.$$(".opening");
    const jobListings = [];

    for (const jobElement of jobElements) {
      const title = await jobElement.$eval("a", (el) => el.textContent.trim());
      const location = await jobElement.$eval("span", (el) =>
        el.textContent.trim()
      );
      const url = await jobElement.$eval("a", (el) => el.href);

      // Call getJobDetails function for each job URL
      const jobDetails = await getJobDetails(url, iframe);

      jobListings.push({
        title,
        location,
        url,
        ...jobDetails,
      });
    }

    await browser.close();

    return jobListings;
  } catch (error) {
    console.error(`Error while fetching job listings. Error: ${error.message}`);
    return null;
  }
};

app.get("/jobs", async (req, res) => {
  const jobListings = await getJobListings();

  if (jobListings) {
    res.json(jobListings);
  } else {
    res.status(500).send("Error while fetching job listings");
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});
