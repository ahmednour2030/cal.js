google.load( "gdata", "2.x" );

function loadCalendarByAddress(calendarAddress, callback, context) {
  var calendarUrl = 'https://www.google.com/calendar/feeds/' +
                    calendarAddress + '/public/full';
  loadCalendar(calendarUrl, callback, context);
}

function loadCalendar(calendarUrl, callback, context) {
  var service = new google.gdata.calendar.CalendarService('gcal4cal.js');
  var query = new google.gdata.calendar.CalendarEventQuery(calendarUrl);
  query.setOrderBy('starttime');
  query.setSortOrder('ascending');
  query.setFutureEvents(true);
  query.setSingleEvents(true);
  query.setMaxResults(10);
  service.getEventsFeed(query, function(feedRoot) {
    callback.apply(context, [listEvents(feedRoot)] );
  },
  handleGDError);
}

function handleGDError(e) {
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
}

function listEvents(feedRoot) {
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
}
