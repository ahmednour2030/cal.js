// make sure that the Cal global namespace exists
if( ! Cal ) {
  alert( "Can't find a global Cal namespace.\n" +
  "Include https://github.com/christophevg/cal.js in your project." );
}

// check that the global google namespace exists
if( ! google ) {
  alert( "Can't find a global google namespace.\n" +
  "Include http://google.com/jsapi in your project." );
}

google.load( "gdata", "2.x" );

(function (globals) {

  var

  loadCalendarByAddress = function loadCalendarByAddress(calendar, cb, ctx) {
    var calendarUrl = 'https://www.google.com/calendar/feeds/' +
                      calendar + '/public/full';
    loadCalendar(calendarUrl, cb, ctx);
  },

  loadCalendar = function loadCalendar(calendarUrl, callback, context) {
    var service = new google.gdata.calendar.CalendarService('gcal4cal.js');
    var query = new google.gdata.calendar.CalendarEventQuery(calendarUrl);
    query.setOrderBy('starttime');
    query.setSortOrder('ascending');
    query.setFutureEvents(true);
    query.setSingleEvents(true);
    query.setMaxResults(10);
    service.getEventsFeed(query, function(feedRoot) {
        callback.apply(context, [ listEvents(feedRoot) ] );
      },
      handleGDError);
  },

  listEvents = function listEvents(feedRoot) {
    var events = {};
    var entries = feedRoot.feed.getEntries();
    var calendar = feedRoot.feed.title.$t;
    var len = entries.length;
    for( var i = 0; i < len; i++ ) {
      var entry = entries[i];
      var title = entry.getTitle().getText();
      var date1 = null;
      var date2 = null;
      var type;
      var times = entry.getTimes();
      if( times.length > 0 ) {
        type  = "timed";
        date1 = times[0].getStartTime().getDate();
        date2 = times[0].getEndTime().getDate();
      } else {
        type = "allday";
      }
      // create event
      var event = {
        type     : type,
        subject  : title,
        calendar : "google-" + calendar
      };
      if( type == "timed" && (date2 - date1 < 86400000) ) {
        event.start = date1.getHours() + ":" + date1.getMinutes();
        event.end   = date2.getHours() + ":" + date2.getMinutes();
      } else {
        event.type = "allday";
      }
      var key = date1.getDate() + "-" + ( date1.getMonth() + 1 ) + "-"
      + date1.getFullYear();
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

  provider = globals.Cal.providers.google = {};
  
  provider.connect = function connect( calendar ) {
    return new provider.connection( calendar );
  };
  
  provider.connection = function connection( calendar ) {
    this.calendar = calendar;
  };

  provider.connection.prototype.getData = function getData( from, to, cb, ctx ) {
    loadCalendarByAddress( this.calendar, cb, ctx );    
  };

})(window);