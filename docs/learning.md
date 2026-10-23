# Learning journal

The "Ask Your Agent" prompt from each step of Assignment 4, and the answer, in step order.

## Step 0: Free tiers

> "Walk me through the free tier limits for each service my app uses, and how to set usage limits and spending alerts for each one."

*To be written at the end of step 0.*

## Step 1: The Open-Meteo response

> "Explain this response: what each field means, and which ones my tool needs."

Pack Again uses two Open-Meteo APIs, both without a key: the place search (geocoding) to find a trip's destination, and the forecast for that place. Calls made on 22 Oct 2026.

### Place search

`GET https://geocoding-api.open-meteo.com/v1/search?name=Valparaíso&count=5&language=es&format=json`

```json
{
  "results": [
    {
      "id": 3868626, "name": "Valparaíso",
      "latitude": -33.036, "longitude": -71.62963, "elevation": 15.0,
      "feature_code": "PPLA", "country_code": "CL", "country": "Chile",
      "admin1": "Región de Valparaíso", "admin2": "Valparaíso", "admin3": "Valparaíso",
      "timezone": "America/Santiago", "population": 282448
    }
  ],
  "generationtime_ms": 0.6
}
```

Four more Valparaísos come back: Indiana (US), Zacatecas (Mexico), and Caquetá and Antioquia (Colombia). Results are sorted by population.

| Field | Meaning | Needed? |
|---|---|---|
| `results` | The matching places. **Missing entirely** when nothing matches. | Yes: missing means "no places found" |
| `id` | GeoNames' permanent id for the place | Yes: a stable key for the place picked |
| `name` | Place name, in the language asked for | Yes |
| `admin1` | Region or state | Yes: tells same-name places apart |
| `country`, `country_code` | Country name and two-letter code | Yes: also tells them apart |
| `latitude`, `longitude` | The place's coordinates | Yes: the forecast needs them |
| `timezone` | The place's time zone | Maybe: the forecast gets it with `timezone=auto` |
| `admin2`, `admin3`, `*_id`, `feature_code`, `population`, `elevation`, `postcodes` | Smaller divisions, ids, place type, size, height, postal codes (some often missing) | No |
| `generationtime_ms` | Server time | No |

**Nothing found** (`zzqxv`, an empty name or a single letter) returns HTTP 200 and only `{"generationtime_ms": 0.05}`, with no `results` key at all, not even an empty list.

### Forecast

`GET https://api.open-meteo.com/v1/forecast?latitude=-33.036&longitude=-71.62963&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto&forecast_days=7`

```json
{
  "latitude": -33.075573, "longitude": -71.64618,
  "timezone": "America/Santiago", "timezone_abbreviation": "GMT-3", "utc_offset_seconds": -10800,
  "elevation": 11.0,
  "daily_units": { "temperature_2m_max": "°C", "precipitation_probability_max": "%", "uv_index_max": "", "wind_speed_10m_max": "km/h", "…": "…" },
  "daily": {
    "time": ["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28"],
    "weather_code": [53, 51, 1, 3, 51, 3, 3],
    "temperature_2m_max": [19.1, 18.0, 17.7, 22.3, 19.0, 20.2, 21.0],
    "temperature_2m_min": [14.0, 12.4, 11.1, 13.5, 15.4, 15.0, 13.9],
    "precipitation_probability_max": [100, 100, 2, 0, 12, 14, 0],
    "uv_index_max": [8.2, 8.1, 8.35, 7.95, 5.35, 8.5, 8.4],
    "wind_speed_10m_max": [17.3, 21.0, 22.4, 22.7, 16.7, 20.1, 12.0],
    "wind_gusts_10m_max": [47.2, 49.7, 51.8, 50.8, 40.3, 47.9, 32.4],
    "wind_direction_10m_dominant": [357, 203, 194, 188, 205, 200, 244]
  }
}
```

The daily values are parallel arrays: day `i` is position `i` in every array.

| Field | Meaning | Needed? |
|---|---|---|
| `daily.time` | Each day's local date, today first | Yes: day labels |
| `daily.temperature_2m_max`, `_min` | Highest and lowest air temperature that day, 2 m above ground, °C | Yes: warm layers or light clothes |
| `daily.precipitation_probability_max` | Highest chance of rain in any hour that day, 0–100% | Yes: umbrella, rain jacket |
| `daily.weather_code` | WMO code for the day's main weather (1 mainly clear, 3 overcast, 51/53 drizzle) | Yes: a word or icon per day, from our own code table |
| `daily.uv_index_max` | Strongest sun that day (no unit; 8+ is very high) | Yes: sunscreen, hat |
| `daily.wind_speed_10m_max` | Strongest sustained wind, km/h | Yes: windbreaker |
| `daily.wind_gusts_10m_max` | Strongest gust, km/h | Optional |
| `daily.wind_direction_10m_dominant` | Where the wind mostly comes from, degrees | No |
| `daily_units` | The unit of each field | No: fixed by what we ask for |
| `timezone`, `timezone_abbreviation`, `utc_offset_seconds` | The time zone of the dates | No: `timezone=auto` gives local dates already |
| `latitude`, `longitude`, `elevation` | The model's grid point, slightly off from the place | No |
| `generationtime_ms` | Server time | No |

### Errors

Any invalid request returns HTTP 400 with `{"error": true, "reason": "…"}`. For example: "Latitude must be in range of -90 to 90°. Given: 200.0.", "Invalid timezone", "Forecast days is invalid. Allowed range 0 to 16." The reasons can be technical, so the app checks `error` and shows its own message. Responses have no rate-limit headers.

### So the tool needs

- **From the search:** `id`, `name`, `admin1`, `country`, `latitude` and `longitude`. A result reads "Valparaíso · Región de Valparaíso, Chile".
- **From the forecast:** `time`, `weather_code`, `temperature_2m_max` and `_min`, `precipitation_probability_max`, `uv_index_max` and `wind_speed_10m_max`.
- **What's saved:** probably only the place. The forecast can be fetched fresh each time.

### Terms (free, non-commercial)

- **Use:** non-commercial only. Educational projects qualify.
- **Limits:** under 600 calls a minute, 5,000 an hour, 10,000 a day and 300,000 a month. A request with more than 10 variables, or more than 2 weeks of data, counts as more than one call.
- **Credit:** under CC BY 4.0, a "Weather data by Open-Meteo.com" link to https://open-meteo.com/ must sit next to the weather.
- **Shared IPs:** limits are counted per IP address and per application. Apps on Vercel can hit them sooner, because Vercel's IPs are shared.
- **Privacy:** server logs, which can include the coordinates requested, are kept for 90 days.

Sources: [terms](https://open-meteo.com/en/terms), [licence](https://open-meteo.com/en/licence), [pricing](https://open-meteo.com/en/pricing).
