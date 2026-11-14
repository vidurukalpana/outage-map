# User Stories

## 1. Report an outage

As a resident, I want to tap the map to report a power, water, internet outage or a blocked road, so that others nearby know about it.

- Choose one of the four types; a short note (up to 140 characters) is optional.
- Reports outside Sri Lanka are rejected.
- The pin is rounded to about 100 m; no exact home location is stored.

## 2. See grouped outages

As a resident, I want to see nearby reports of the same type grouped into one circle with a count, so that I can tell whether it is just my house or the whole area.

- Reports of the same type within 500 m form one group.
- Each type has its own colour; the circle grows with the count.
- The map refreshes every 30 seconds.
- Reports with no activity for 24 hours leave the live map.

## 3. Add "me too"

As a resident with the same problem, I want to add "me too" to an existing report, so that the outage shows how many people it affects.

- One "me too" per device per report.
- A "me too" keeps the report on the live map for another 24 hours.

## 4. Mark as resolved

As a resident whose service is back, I want to mark a report as resolved, so that the map shows only current outages.

- A confirmation is asked first.
- A resolved report leaves the live map at once; no more votes are accepted on it.

## 5. Filter by type

As a resident, I want to show or hide outage types on the map, so that I see only the problems I care about.

- Each of the four types has a checkbox; unticking one hides its groups.

## 6. View history

As a resident, I want to see which areas had the most outages in the last 7, 30 or 90 days, so that I know how reliable my area is.

- The busiest 1 km squares are shown on a map plus a top-10 list.
- Each list row shows the count, main type, typical outage length.
- Tapping a row zooms the map to that square.

## 7. Blocked by rate limit

As a resident who sent too many reports or votes in a short time, I want a clear message, so that I know to try again later.

- Limits per IP: 5 reports / 10 min, 20 votes / 10 min, 120 reads / min.
- Over the limit, the app shows "You've sent a lot of reports. Try again in a few minutes." without crashing.

All times are shown in Sri Lanka time (`Asia/Colombo`, UTC+05:30).
