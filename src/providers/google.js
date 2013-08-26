// check that the global google namespace exists
if( typeof google != "object" ) {
  alert( "Unable to access Google.\n"
         + "Please make sure http://google.com/jsapi is included in your "
         + "project and that your browser can access the internet." );
} else {
  google.load( "gdata", "2.x" );
}

(function (globals) {

  var

  getCalendarUrl = function getCalendarUrl( name, secret ) {
    var url = 'https://www.google.com/calendar/feeds/' + name;
    if( typeof secret != "undefined" && secret != null ) {
      url += '/private-' + secret;
    } else {
      url += '/public';
    }
    return url + '/full';
  },

  loadCalendar = function loadCalendar( calendar, secret, start, end, cb, ctx ) {
    if( typeof google != "object" ) {
      cb.apply( ctx, [ {} ] );
      return;
    }
    
    var url     = getCalendarUrl(calendar, secret);
    var service = new google.gdata.calendar.CalendarService('gcal4cal.js');
    var query   = new google.gdata.calendar.CalendarEventQuery(url);

    query.setSingleEvents(true);
    query.setMaxResults(3000); // default seems to be 25
    query.setMinimumStartTime(new google.gdata.DateTime(start));
    query.setMaximumStartTime(new google.gdata.DateTime(end));

    service.getEventsFeed( query, function(feedRoot) {
      cb.apply(ctx, [ listEvents(feedRoot) ] );
    }, handleGDError);
  },

  listEvents = function listEvents(feedRoot) {
    var events   = {};
    var entries  = feedRoot.feed.getEntries();
    var calendar = feedRoot.feed.title.$t;
    var len      = entries.length;

    for( var i = 0; i<len; i++ ) {
      var entry = entries[i];
      var title = entry.getTitle().getText();
      var date1 = null;
      var date2 = null;
      var times = entry.getTimes();

      if( times.length > 0 ) {
        date1 = times[0].getStartTime().getDate();
        date2 = times[0].getEndTime().getDate();
      } else {
        alert("Didn't get timing info. This shouldn't happen ;-)");
      }
      // create event
      var event = {
        type     : "timed",
        subject  : title,
        calendar : "google-" + calendar
      };

      if( date2 - date1 < 86400000 ) {
        event.start = date1.getHours() + ":" + date1.getMinutes();
        event.end   = date2.getHours() + ":" + date2.getMinutes();
      } else {
        event.type  = "allday";
      }
      var key = date1.getFullYear() + "/" + ( date1.getMonth() + 1 ) + "/"
              + date1.getDate();
      if( typeof events[key] == "undefined" ) { events[key] = []; }
      events[key].push( event );
    }
    return events;
  },

  handleGDError = function handleGDError(e) {
    if( e instanceof Error ) {
      alert('Error at line ' + e.lineNumber + ' in ' + e.fileName + '\n' +
            'Message: ' + e.message);
      if( e.cause ) {
        var status = e.cause.status;
        var statusText = e.cause.statusText;
        alert('Root cause: HTTP error ' + status + ' with status text of: ' + 
              statusText);
      }
    } else {
      alert(e.toString());
    }
  },

  provider = globals.providers.google = {};
  
  provider.connect = function connect( calendar, secret ) {
    return new provider.connection( calendar, secret );
  };
  
  provider.connection = function connection( calendar, secret ) {
    secret = secret || null;
    this.calendars = [];
    this.connect(calendar, secret);
  };

  provider.connection.prototype.connect =
    function connect(calendar, secret) {
      this.calendars.push({ "calendar": calendar, "secret": secret} );
      return this;
    }

  provider.connection.prototype.getData = 
    function getData( start, end, cb, ctx ) {
      for(var i=0; i<this.calendars.length; i++) {
        loadCalendar( this.calendars[i].calendar, this.calendars[i].secret,
                      start, end, cb, ctx );
      }
    };

})( Cal || window );
