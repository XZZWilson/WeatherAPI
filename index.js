import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=37.2296&longitude=-80.4139&hourly=temperature_2m&current=temperature_2m&temperature_unit=fahrenheit&timezone=auto";

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const formatTime = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getIcon = (temp) => {
  if (temp === null || temp === undefined) {
    return "cloud";
  }
  if (temp >= 80) {
    return "sun";
  }
  if (temp >= 60) {
    return "partly";
  }
  if (temp >= 40) {
    return "cloud";
  }
  return "snow";
};

app.get("/", (req, res) => {
  res.render("index.ejs", {
    showWeather: false,
    temperature: null,
    unit: "F",
    hourly: [],
    error: null,
  });
});

app.post("/weather", async (req, res) => {
  try {
    const result = await axios.get(API_URL);
    const temperature = result.data?.current?.temperature_2m ?? null;
    const unitFromApi = result.data?.current_units?.temperature_2m ?? "F";
    const unit = unitFromApi.includes("F") ? "F" : unitFromApi;

    const hourlyTimes = result.data?.hourly?.time ?? [];
    const hourlyTemps = result.data?.hourly?.temperature_2m ?? [];
    const hourly = hourlyTimes.slice(0, 12).map((time, index) => {
      const temp = hourlyTemps[index];
      return {
        time: formatTime(time),
        temperature: temp,
        icon: getIcon(temp),
      };
    });

    res.render("index.ejs", {
      showWeather: true,
      temperature,
      unit,
      hourly,
      error: null,
    });
  } catch (error) {
    res.render("index.ejs", {
      showWeather: true,
      temperature: null,
      unit: "F",
      hourly: [],
      error: "Failed to fetch weather data.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
