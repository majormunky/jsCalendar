# jsCalendar
Javascript powered event calendar

## To use
Include the jsCalendar.js file on your page, and then start it up like so:

```javascript
let calendar;
document.addEventListener("DOMContentLoaded", (event) => {
	calendar = new Calendar(document.getElementById("calendar"), {});
});
```

This should show a calendar on the page and should let you move between months.  This is currently in alpha stage.


## Events
To show events on the calendar, we need to provide some information so the calendar knows how to get the events.  Lets say we have a webserver setup at a url like /event-feed/, it should return a list of json objects:
```javascript
[
	{name: "Test Event", time: "2021-04-26T12:33:55", date_str: "2021-04-26", id: 1},
	{name: "Test Event 2", time: "2021-04-28T12:33:55", date_str: "2021-04-28", id: 2},
]
```
To let the calendar know about this, you need to call a method with a config object:
```javascript
let calendar;
document.addEventListener("DOMContentLoaded", async (event) => {
	calendar = new Calendar(document.getElementById("calendar"), {});

	await calendar.add_event_feed({name: "Test Feed", url: "/event-feed/"});
});
```
Note that the event fetching system is async so be sure to use await when adding the event feeds.

More to come!