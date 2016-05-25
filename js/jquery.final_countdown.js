
/******************************************************************************

jQuery Final CountDown Plugin
version 0.1
author: Andrew Magill

This plugin can be used to create a countdown.

This plugin is released under MIT License :
http://opensource.org/licenses/mit-license.php 


Instructions :

You can initialize the plugin a few different ways.

Quick and easy method: ________________________________________________________
Simply specify an end time (mandatory) in ISO8601 format :

	$.fn.countdown({
		'end_time': '2013-11-29T05:00:00-05:00'
	});


Custom Options: _______________________________________________________________
allows any number of optional customizations :
	$.fn.countdown({
		'end_time': '2013-11-29T05:00:00-05:00',
		'counter_selector': '#countdown',
		'intro_message': 'Your <strong>Special Offer</strong> begins in ', //  can include HTML
		'complete_message': 'Your Special Offer is available NOW!', //  can include HTML
		'days_label': 'days,',
		'hours_label': 'hours,',
		'minutes_label': 'minutes,',
		'seconds_label': 'seconds.',
		'time_api': 'http://www.timeapi.org/utc/now.json'
	});


******************************************************************************/

// Countdown constructor function
var Countdown = this.Countdown = function(options){

	// if the labels for measures of time have been customised, then add surrounding spaces
	add_spaces('days_label');
	add_spaces('hours_label');
	add_spaces('minutes_label');
	add_spaces('seconds_label');
	function add_spaces(label){
		if (options[label]){options[label]=' '+options[label]+' '}
	}

	// For any option not set, use the default value
	this.options = jQuery.extend({}, this.defaults, options);

	this.init();
};

// Prototype defintion
Countdown.prototype = {

	defaults: {
		counter_selector: '#countdown',
		intro_message: '',
		complete_message: '',
		days_label: ':',
		hours_label: ':',
		minutes_label: ':',
		seconds_label: '',
		time_api: 'http://www.timeapi.org/utc/now.json'
	},

	init: function(){

		this.counter = $(this.options['counter_selector']);

		if (undefined != this.options['end_time']){

			this.end_time = new Date.fromISO(this.options['end_time']);
			var last_counter_update = new Date().getTime();
			var timer;

			$.ajax({
				type: "GET",
				url: this.options['time_api'],
				dataType: "jsonp",
				context: this

			}).done(function(data) {
				this.start_time = new Date(data.dateString);
				var milliseconds_remaining = (this.end_time.getTime() - this.start_time.getTime());

				// cacluclate days remaining
				this.days_remaining = Math.floor(milliseconds_remaining/86400000);
				milliseconds_remaining = milliseconds_remaining - (this.days_remaining*86400000);

				// cacluclate hours remaining
				this.hours_remaining = Math.floor(milliseconds_remaining/3600000);
				milliseconds_remaining = milliseconds_remaining - (this.hours_remaining*3600000);

				// cacluclate minutes remaining
				this.minutes_remaining = Math.floor(milliseconds_remaining/60000);
				milliseconds_remaining = milliseconds_remaining - (this.minutes_remaining*60000);

				// cacluclate seconds remaining with milliseconds as a decimal
				this.seconds_remaining = milliseconds_remaining/1000;

				// If we have not reached the end of the timer...
				var that = this;
				if (this.days_remaining>-1){
					// if an intro message has been specified, display it above the counter
					if (this.options['intro_message']){
						this.counter.before('<span class="intro_message">'+this.options['intro_message']+'</span>');
					}
					// display the countdown initial value
					update_counter.call(this);

					// start the update loop
					timer=setInterval(function() {
						update_counter.call(that);
					},1000);
				}
				else {complete.call(that);};
			})
			.fail(function(){
				throw new Error('CountDown Plugin - failure getting time from timeAPI.org.');
			});

			function ISODateString(d) {
				function pad(n){
					return n<10 ? '0'+n : n
				}
				return d.getUTCFullYear()+'-'
				+ pad(d.getUTCMonth()+1)+'-'
				+ pad(d.getUTCDate())+'T'
				+ pad(d.getUTCHours())+':'
				+ pad(d.getUTCMinutes())+':'
				+ pad(d.getUTCSeconds())+'Z'
			}

			function update_counter(){

				// check if any measure of time is less 0 at the end of each minute,
				// if so, restart the counter for that measure of time
				if (this.seconds_remaining<0){
					this.seconds_remaining=this.seconds_remaining+60;
					this.minutes_remaining--;

					if (this.minutes_remaining<0){
						this.minutes_remaining=59;
						this.hours_remaining--;

						if (this.hours_remaining<0){
							this.days_remaining--;
							this.hours_remaining=23;
						}
					}
				}
				
				// if any measure of time is less than 10, make the first character 0
				this.days_remaining=pad_digit(this.days_remaining);
				this.hours_remaining=pad_digit(this.hours_remaining);
				this.minutes_remaining=pad_digit(this.minutes_remaining);

				function pad_digit(num){
					var s = num+'';
					if (s.length < 2) {s = '0' + s;}
					return s;
				}

				//Display the countdown and decrement seconds
				this.counter.text(this.days_remaining+this.options['days_label']+
					this.hours_remaining+this.options['hours_label']+
					this.minutes_remaining+this.options['minutes_label']+
					pad_digit(Math.floor(this.seconds_remaining))+this.options['seconds_label']
				);

				//  Get the time difference between the last counter update and 
				var current_time = new Date().getTime();
				var seconds_elapsed = (current_time - last_counter_update)/1000;
				this.seconds_remaining = this.seconds_remaining - seconds_elapsed;

				last_counter_update = current_time;


				if (this.days_remaining<0){
					clearInterval(timer);
					complete.call(this);
					return false;
				}
			}
			function complete(){

				// hide the counter and intro message and show the countdown complete message
				if (this.options['complete_message']){
					this.counter.hide();
					$('.intro_message').hide();
					this.counter.after('<span class="complete_message">'+this.options['complete_message']+'</span>')
				}
				else {

					this.counter.text(00+this.options['days_label']+
						00+this.options['hours_label']+
						00+this.options['minutes_label']+
						00+this.options['seconds_label']
					);
				}
				$(this.options['complete_selector']).show();
			}
		}
		else {throw new Error('CountDown Plugin - end time not specified.');}
	}
};

// Extend jQuery with this plugin
jQuery.fn.countdown = function(options){
	new Countdown(options)
	return this;
};


// Creates a new method of parsing dates in the JS Date object for parsing ISO8601 date strings.
// This was added for browsers that don't support ISO8601. Im looking at you IE8 >:[
// Browsers that do support ISO8601 will use the native method

(function(){
var D= new Date('2011-06-02T09:34:29+02:00');
if(isNaN(D) || D.getUTCMonth()!== 5 || D.getUTCDate()!== 2 || D.getUTCHours()!== 7 || D.getUTCMinutes()!== 34){
	Date.fromISO = function(s){
		var day, tz,
		rx=/^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/,
		p= rx.exec(s) || [];
		if(p[1]){
			day= p[1].split(/\D/);
			for(var i= 0, L= day.length; i<L; i++){
				day[i]= parseInt(day[i], 10) || 0;
			}
			day[1]-= 1;
			day= new Date(Date.UTC.apply(Date, day));
			if(!day.getDate()) return NaN;
			if(p[5]){
				tz= (parseInt(p[5], 10)*60);
				if(p[6]) tz+= parseInt(p[6], 10);
				if(p[4]== '+') tz*= -1;
				if(tz) day.setUTCMinutes(day.getUTCMinutes()+ tz);
			}
			return day;
		}
		return NaN;
	}
}
else{
	Date.fromISO= function(s){
		return new Date(s);
	}
}
})()