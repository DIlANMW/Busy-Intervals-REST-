import { google } from "googleapis";
import express from "express";
import dotenv from "dotenv";

const app = express();
const port = 3000;
dotenv.config({});

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SEC,
  process.env.REDIRECT_URL
);

const scopes = ["https://www.googleapis.com/auth/calendar.readonly"];

async function listBusyIntervals(calendarId, startTime, endTime) {
  try {
    const tokens = await oauth2Client.getAccessToken();

    startTime = new Date(startTime).toISOString();
    endTime = new Date(endTime).toISOString();

    // Create a new instance of the calendar API client.
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Define the request parameters.
    const requestParams = {
      calendarId: calendarId,
      timeMin: startTime,
      timeMax: endTime,
    };

    // Make the API request to get busy events.
    const response = await calendar.freebusy.query({
      requestBody: {
        ...requestParams,
        items: [{ id: calendarId }],
      },
    });

    // Extract busy intervals from the response.
    const busyIntervals = response.data.calendars[calendarId].busy;
    return busyIntervals;
  } catch (error) {
    console.error("Error fetching busy intervals:", error);
    throw error;
  }
}

app.get("/", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });

  res.redirect(url);
});

app.get("/google/redirect", async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const calendarId = "dilanweerasinghe97@gmail.com"; 
    const startTime = "2023-09-01T00:00:00Z"; 
    const endTime = "2023-09-30T23:59:59Z"; 
    const busyIntervals = await listBusyIntervals(
      calendarId,
      startTime,
      endTime
    );

    res.json({ busyIntervals });
  } catch (error) {
    console.error("Error during OAuth2 callback:", error);
    res.status(500).send("Error during OAuth2 callback");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port:${port}`);
});
