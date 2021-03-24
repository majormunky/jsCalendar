if (!String.prototype.lpad) {
    String.prototype.lpad = function(pad, len) {
        while (pad.length < len) {
            pad += pad;
        }
        return pad.substr(0, len-this.length) + this;
    }
}

if (!String.prototype.rpad) {
    String.prototype.rpad = function(pad, len) {
        while (pad.length < len) {
            pad += pad;
        }
        return this + pad.substr(0, len-this.length);
    }
}


class Calendar {
    constructor(el, options) {
        this.el = el;
        this.current_dt = new Date();
        this.today = new Date();
        this.max_days = {
            0: 31,
            1: 28,
            2: 31,
            3: 30,
            4: 31,
            5: 30,
            6: 31,
            7: 31,
            8: 30,
            9: 31,
            10: 30,
            11: 31
        };
        this.event_feeds = [];
        this.events = {};
        this.first_date = null;
        this.last_date = null;
        this.setup_handlers();
        this.setup();
    }

    setup() {
        this.rows = null;
        this.build(); 
        this.render();
    }

    async add_event_feed(options) {
        this.event_feeds.push(options);
        await this.fetch_events();
    }

    async fetch_events() {
        let source;
        for (var i = 0; i < this.event_feeds.length; i++) {
            source = this.event_feeds[i];
            let url = `${source.url}?start=${this.first_date}&end=${this.last_date}`;
            this.events[source.name] = await this.get(url);
        }
        this.render_events();
    }

    async get(url) {
        console.log("Fetching", url);
        let response = await fetch(url, {method: "GET"});
        return response.json();
    }

    render_events() {
        for (var event_source_name in this.events) {
            for (var i = 0; i < this.events[event_source_name].length; i++) {
                let event = this.events[event_source_name][i];
                this.add_event_to_day_cell(event);
            }
        }
    }

    add_event_to_day_cell(event) {
        let output = `<div class='event' data-event-id='${event.id}'>${event.name}</div>`;
        let day_cell = document.querySelector(`[data-date-str='${event.date_str}']`);
        day_cell.querySelector(".event-wrapper").innerHTML += output;
    }
	
	load_events(name, event_list) {
		this.events[name] = event_list;
		this.render_events();
	}

    build() {
        let rows = [];
        let max_days_this_month = this.max_days[this.current_dt.getMonth()];
        let first_day_of_month = new Date(this.current_dt.getFullYear(), this.current_dt.getMonth(), 1);
        let first_day_num = first_day_of_month.getDay();
        let first_week_days = 7 - first_day_num;
        let max_days_last_month;
        let current_day, day_obj;
        if (this.current_dt.getMonth() == 0) {
            max_days_last_month = this.max_days[11];
        } else {
            max_days_last_month = this.max_days[this.current_dt.getMonth() - 1];
        }

        let week = [];

        // build up our days from the last month
        for (var i = 0; i < first_day_num; i++) {
            let day_num = String(max_days_last_month - i).lpad("0", 2);
            let month_num = String(this.current_dt.getMonth()).lpad("0", 2);
            let date_str = `${this.current_dt.getFullYear()}-${month_num}-${day_num}`
            if (i == 0) {
                this.first_date = date_str;    
            }
            day_obj = {
                this_month: false,
                day_num: day_num,
                today: false,
                date_str: date_str,
            };
            week.push(day_obj);
        }

        // finish the week with the first days of the current month
        for (var j = 1; j <= first_week_days; j++) {
            let day_num = String(j).lpad("0", 2);
            let month_num = String(this.current_dt.getMonth() + 1).lpad("0", 2);
            day_obj = {
                this_month: true,
                day_num: j,
                today: false,
                date_str: `${this.current_dt.getFullYear()}-${month_num}-${day_num}`,
            };
            week.push(day_obj);
            current_day = j;
        }

        // we are done building our week, add it to the rows list
        rows.push(week);

        // increment our day to start the new week
        current_day += 1;

        // reset our week list
        week = [];

        // enter a while loop that stops when we are done with the days of this month
        while (current_day <= max_days_this_month) {
            // get the last day of the week
            let end_of_week = current_day + 7;
            // we use the last day to loop over the days
            for (var w = current_day; w < end_of_week; w++) {
                // push our day to the week list
                let day_num = String(current_day).lpad("0", 2);
                let month_num = String(this.current_dt.getMonth() + 1).lpad("0", 2);
                day_obj = {
                    this_month: true,
                    day_num: current_day,
                    today: false,
                    date_str: `${this.current_dt.getFullYear()}-${month_num}-${day_num}`,
                };
                if (
					(this.today.getDate() == current_day) && 
					(this.today.getMonth() == this.current_dt.getMonth()) && 
					(this.today.getFullYear() == this.current_dt.getFullYear())) {
                    day_obj.today = true;
                }

                week.push(day_obj);

                // increment our current day
                current_day += 1;

                // check to see if we are over our days of the month
                if (current_day > max_days_this_month) {
                    // we are, break out of our loop
                    break;
                }
            }
            // push our week to our rows
            rows.push(week);

            // reset the week list
            week = [];
        }

        // after creating the days for the current month
        // we need to check if we need to draw any days
        // for the next month
        // we mainly do this by checking how many days we have added
        // in our last week
        let days_to_create = 7 - rows[rows.length - 1].length;
        
        // if we have days to create
        if (days_to_create > 0) {
            // create them for the next month
            for (var i = 1; i <= days_to_create; i++) {
                let day_num = String(i).lpad("0", 2);
                let month_num = this.current_dt.getMonth() + 2;
                if (month_num > 11) {
                    month_num = 0;
                } else {
                    month_num = String(month_num).lpad("0", 2);
                }
                day_obj = {
                    this_month: false,
                    day_num: i,
                    today: false,
                    date_str: `${this.current_dt.getFullYear()}-${month_num}-${day_num}`,
                };
                rows[rows.length - 1].push(day_obj);
            }
        }

        this.last_date = rows[rows.length - 1][6].date_str;

        // set our rows to a place we can render from
        this.rows = rows;
    }

    setup_handlers() {
        this.el.addEventListener("click", async (event) => {
            if (event.target.matches("#prev-month")) {
                await this.prev_month();
                return;
            }

            if (event.target.matches("#next-month")) {
                await this.next_month();
                return;
            }

            if (event.target.matches(".event")) {
                let event_clicked_event = new CustomEvent("EventClickedEvent", {detail: {event_id: event.target.dataset.eventId}});
                document.dispatchEvent(event_clicked_event);
            }
            
            if (event.target.matches(".day")) {
                let day_clicked_event = new CustomEvent("DayClickedEvent", {detail: {date_str: event.target.dataset.dateStr}})
                document.dispatchEvent(day_clicked_event);
            }
            
        }, false);
    }

    async prev_month() {
        let month_num = this.current_dt.getMonth();
        let year_num = this.current_dt.getFullYear();
        let next_month_num = month_num - 1;
        if (next_month_num < 0) {
            next_month_num = 11;
            year_num -= 1;
        }
        let new_dt = new Date(year_num, next_month_num, 1);
        this.current_dt = new_dt;
        this.setup();
        await this.render_events();
    }

    async next_month() {
        let month_num = this.current_dt.getMonth();
        let year_num = this.current_dt.getFullYear();
        let next_month_num = month_num + 1;
        if (next_month_num > 11) {
            next_month_num = 0;
            year_num += 1;
        }
        let new_dt = new Date(year_num, next_month_num, 1);
        this.current_dt = new_dt;
        this.setup();
        await this.render_events();
    }

    build_header() {
        const month = this.current_dt.toLocaleString('default', { month: 'long' });
    
        let output = "<div id='calendar-header'>";
        output += `<h3 class='align-middle'>${month} - ${this.current_dt.getFullYear()}</h3>`;
        output += "<div class='btn-group float-end' role='group'>";
        output += "<button class='btn btn-outline-primary' id='prev-month'>Prev</button>";
        output += "<button class='btn btn-outline-primary' id='next-month'>Next</button>";
        output += "</div>";
        output += "</div>";
        return output;
    }

    load_temp_event(new_event) {
        add_event_to_day_cell(new_event);
    }

    render() {
        let output = "<div id='calendar-wrapper'>";
        output += this.build_header();
        for (var i = 0; i < this.rows.length; i++) {
            if (i == 0) {
                output += "<div class='week-row first-week'>";    
            } else if (i == this.rows.length - 1) {
                output += "<div class='week-row last-week'>";
            } else {
                output += "<div class='week-row'>";
            }
            for (var d = 0; d < this.rows[i].length; d++) {
                if (this.rows[i][d].this_month) {
                    if (this.rows[i][d].today) {
                        output += `<div class='day month-day today' data-date-str='${this.rows[i][d].date_str}'>`;
                    } else {
                        output += `<div class='day month-day' data-date-str='${this.rows[i][d].date_str}'>`;
                    }
                } else {
                    output += `<div class='day non-month-day' data-date-str='${this.rows[i][d].date_str}'>`;
                }
                
                output += `<div class='day-label'>${this.rows[i][d].day_num}</div>`;
                output += "<div class='event-wrapper'></div>";
                output += "</div>";
            }
            output += "</div>";
        }
        output += "</div>";
        this.el.innerHTML = output;
    }
}
