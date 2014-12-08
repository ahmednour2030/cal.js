window.JSON || document.write('<script src="//cdnjs.cloudflare.com/ajax/libs/json3/3.2.4/json3.min.js"><\/scr'+'ipt>');
    
(function (globals) {

  var
  xmlhttp = null,    

  initAjax = function initAjax() {
    if(window.XMLHttpRequest) {
      // code for IE7+, Firefox, Chrome, Opera, Safari
      xmlhttp=new XMLHttpRequest();
    } else if (window.ActiveXObject) {
      // code for IE6, IE5
      xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    } else {
      alert("Your browser does not support XMLHTTP!");
    }
  },

  fetchUrl = function getUrl(url, cb) {
    if(xmlhttp == null) { initAjax(); }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
      if( xmlhttp.readyState==4 && xmlhttp.status==200 ) {
        cb(xmlhttp.responseText);
      }
    }
  }

  getCalendarUrl = function getCalendarUrl( name, key, start, end ) {
    return 'https://www.googleapis.com/calendar/v3/calendars/' + name
         + '/events?key=' + key
         + "&timeMin=" + start.toISOString()
         + "&timeMax=" + end.toISOString();
  },

  loadCalendar = function loadCalendar( calendar, key, start, end, cb, ctx ) {
    var url = getCalendarUrl(calendar, key, start, end);
    fetchUrl(url, function(data) {
      cb.apply(ctx, [ listEvents(JSON.parse(data)) ]);
    });
  },

  listEvents = function listEvents(feedRoot) {
    var events   = {};
    var calendar = feedRoot["summary"];
    var entries  = feedRoot["items"];
    var len      = entries.length;

    for(var i=0; i<len; i++) {
      var entry = entries[i];
      var title = entry["summary"];
      var date1 = new Date(Date.parse(
        entry["start"]["dateTime"] ? entry["start"]["dateTime"] : entry["start"]["date"]
      ));
      var date2 = new Date(Date.parse(
        entry["end"]["dateTime"] ? entry["end"]["dateTime"] : entry["start"]["date"]
      ));
      
      // create event
      var event = {
        type     : (entry["start"]["dateTime"] ? "timed" : "allday"),
        subject  : title,
        calendar : "google-" + calendar,
        start    : date1,
        end      : date2
      };

      var key = date1.getFullYear() + "/" + ( date1.getMonth() + 1 ) + "/"
              + date1.getDate();
      if( typeof events[key] == "undefined" ) { events[key] = []; }
      events[key].push( event );
    }
    return events;
  },

  provider = globals.providers.google = {};
  
  provider.connect = function connect( calendar, key ) {
    return new provider.connection( calendar, key );
  };
  
  provider.connection = function connection( calendar, key ) {
    key = key || null;
    this.calendars = [];
    this.connect(calendar, key);
  };

  provider.connection.prototype.connect =
    function connect(calendar, key) {
      this.calendars.push({ "calendar": calendar, "key": key} );
      return this;
    }

  provider.connection.prototype.getData = 
    function getData( start, end, cb, ctx ) {
      for(var i=0; i<this.calendars.length; i++) {
        loadCalendar( this.calendars[i].calendar, this.calendars[i].key,
                      start, end, cb, ctx );
      }
    };

})( Cal || window );
