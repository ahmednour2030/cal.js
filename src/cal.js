(function (globals) {
  
  var
  
  // first some private functionality, we don't expose this
  
  log = function log( msg ) {
    if( console && typeof console.log == "function" ) {
      console.log( msg );
    }
  },
  
  isSameDay = function isSameDay(day1, day2) {
    return formatDate("yyyy/m/d", day1) 
        == formatDate("yyyy/m/d", day2);
  },
  
  formatDate = function formatDate(format, date) {
    // TODO add all possible formats, now only the one we use ;-)
    return format.replace(    "d", date.getDate()     )
                 .replace(    "m", date.getMonth() +1 )
                 .replace( "yyyy", date.getFullYear() );
  },

  daysInMonth = function daysInMonth(month, year) {
	  return 32 - new Date(year, month, 32).getDate();
  },
  
  createDay = function createDay(context, day, events) {
    var container = document.createElement("DIV");
    container.className = "container";
    
    // create date header
    var date = document.createElement("DIV");
    date.className = "number";
    date.innerHTML = day.getDate();
    container.appendChild(date);
    
    // add events
    var count = events.length;
    for(var e=0; e<count; e++ ) {
      var event = events[e];
      var elem = document.createElement("DIV");
      elem.className = event.type + " event " + event.calendar;
      elem.onclick = (function(ev) { 
        return function(e) {
          context.handleEventSelection(ev, elem);
          if( !e ) { var e = window.event; }
	        e.cancelBubble = true;
	        if( e.stopPropagation ) { e.stopPropagation(); }
        }
      })(event);
      var subject = ( event.type == "timed" ? event.start + " " : "" ) 
                  + event.subject;
      elem.innerHTML = subject;
      container.appendChild(elem);
    }

    return container;
  },
  
  removeFromArray = function removeFromArray(array) {
    for( var i=1; i<arguments.length; i++ ) {
      var idx = array.indexOf(arguments[i]);
      if( idx != -1 ) {
        array.splice( idx, 1 );
      }
    }
    return array;
  },
  
  generateClasses = function generateClasses(day, today, classes) {
    classes = removeFromArray( classes || [], 
                               "today", "selected", 
                               "leading", "trailing", "unused" );
    var now = new Date();
    if( isSameDay(day, now) ) {
      classes.push( "today" );
    }
    if( isSameDay(day, today) ) {
      classes.push( "selected" );
    }
    return classes.join( " " );
  },

  // next expose the public cal.js interface, with local reference

  cal = globals.Cal = {};
  
  // public factory method
  cal.activate = function activate(id) {
    var calendar = new cal.calendar();
    return calendar.displayOn(id);
  };
  
  // namespace for data-providers
  cal.providers = {};
  
  // constructor
  cal.calendar = function calendar(id) {
    this.data      = {};
    this.providers = [];
    
    this.notifyOfDaySelection  ( function() { } );
    this.notifyOfEventSelection( function() { } );
  };
  
  cal.calendar.prototype.displayOn = function displayOn(id) {
    this.id = id;
    return this;
  };

  // setters for callbacks

  // a data-provider is called to request new data
  // interface: getData( from, to, callback, context )
  // or: object with getData method
  cal.calendar.prototype.useDataProvider = 
    function useDataProvider( provider, holdActivation ) {
      if( ! this.id ) { holdActivation = true; }
      var newProvider = {};
      if( typeof provider == "function" ) { 
        newProvider.context = this;
        newProvider.method  = provider;
      } else {
        newProvider.context = provider;
        newProvider.method  = provider.getData;
      }
      this.providers.push( newProvider );
      
      // we now have a new dataprovider, we can refresh our data
      if( ! holdActivation ) { this.refreshData(true); }
      return this;
    };

  // a function to call when a Day is selected
  // interface: handleDaySelection(date)
  cal.calendar.prototype.notifyOfDaySelection = 
    function notifyOfDaySelection( cb ) { 
      if( typeof cb == "function" ) { this.handleDaySelection = cb; }
      return this;
    };

  // a function to call when an Event is selected
  // interface: handleEventSelection( event, htmlElement )
  cal.calendar.prototype.notifyOfEventSelection = 
    function notifyOfEventSelection(cb) { 
      if( typeof cb == "function" ) { this.handleEventSelection = cb; }
      return this;
    };

  // method to move the current date one month ahead
  cal.calendar.prototype.gotoNextMonth = function gotoNextMonth() {
    var newDate = new Date( this.getToday().getTime() );
    newDate.setMonth( newDate.getMonth() + 1 );
    this.gotoDate( newDate );
    return this;
  };

  // method to move the current date one month back
  cal.calendar.prototype.gotoPreviousMonth = function gotoPreviousMonth() {
    var newDate = new Date( this.getToday().getTime() );
    newDate.setMonth( newDate.getMonth() - 1 );
    this.gotoDate( newDate );
    return this;
  };
  
  // method to move the current date to the current day
  cal.calendar.prototype.gotoToday = function gotoToday() {
    this.gotoDate( new Date() );
    return this;
  };

  // method to move the current date to a sepecific date
  cal.calendar.prototype.gotoDate = function gotoDate(date) {
    if( ! this.getToday() || ! isSameDay(date, this.getToday() ) ) {
      this.today = date ? new Date( date.getTime() ) : new Date();
      this.start = this.end = null;
      this.refreshData();
      this.handleDaySelection(this.getToday());
    }
    return this;
  };
  
  cal.calendar.prototype.getToday = function getToday() {
    if( ! this.today ) {
      this.today = new Date();
    }
    return this.today;
  };
  
  cal.calendar.prototype.getStart = function getStart() {
    if( ! this.start ) {
      this.start = new Date(this.getToday().getTime());
      this.start.setDate(1);
    }
    return this.start;
  };
  
  cal.calendar.prototype.getEnd = function getEnd() {
    if( ! this.end ) {
      this.end   = new Date(this.getToday().getTime());
      this.end.setDate( daysInMonth( this.getToday().getMonth(), 
                                     this.getToday().getFullYear() ) );
    }
    return this.end;
  };
    
  // schedule a new refresh of the data
  cal.calendar.prototype.scheduleDataRefresh = function scheduleDataRefresh(){
    if( this.timeout ) { 
      log( "WARNING: already scheduled a refresh" );
      return;
    }
    this.timeout = setTimeout( (function(context) {
      return function() { 
        // request a refresh of the data, forcing it to be fetched
        context.refreshData(true);
        // this scheduled execution is done, clear the previous timeout flag
        context.timeout = null;
        // shedule the next refresh
        context.scheduleDataRefresh();
      } 
    })(this), 300000 ); // refresh every 5 minutes
  };

  // method to refresh the data for the currently selected month
  cal.calendar.prototype.refreshData = function refreshData(force) {
    if( this.refreshingData > 0 ) { return; }
    var newRange = this.getStart() + "->" + this.getEnd();
    if( !force && this.currentDataRange == newRange ) {
      // reuse
      this.setData(this.data);
    } else {
      // refresh all providers
      this.data = {};
      this.currentDataRange = newRange;
      var count = this.refreshingData = this.providers.length;
      for( var p=0; p<count; p++ ) {
        var provider = this.providers[p];
        provider.method.apply( provider.context,
                  [ this.getStart(), this.getEnd(), this.addData, this ] );
      }
    }
  };

  // method to accept new data and re-render the visual representation
  cal.calendar.prototype.setData = function setData(data) {
    this.data = data;
    this.render();
  };

  // method to accept new data and re-render the visual representation
  cal.calendar.prototype.addData = function addData(data) {
    for( var day in data ) {
      if( ! this.data[day] ) {
        this.data[day] = data[day];
      } else {
        this.data[day] = this.data[day].concat( data[day] );
      }
    }
    this.refreshingData--;
    this.render();
  };

  // method to render the visual representation
  cal.calendar.prototype.render = function render() {
    var startWeekDay = this.getStart().getDay();
    startWeekDay = startWeekDay == 0 ? 7 : startWeekDay; // move Sunday to end

    // clear leading days
    if( startWeekDay > 1 ) {
      for( var d=1;d<startWeekDay;d++ ) {
        with( document.getElementById( this.id + d ) ) {
          innerHTML = "";
          var classes = removeFromArray( className.split(' '), "leading" );
          classes.push( "leading" );
          className = classes.join( ' ' );
        }
      }
    }

    // actual days in this month
    var now = new Date(this.getStart().getTime());
    for( var d=1; d<=this.getEnd().getDate(); d++ ) {
      now.setDate(d);
      with( document.getElementById( this.id + (d + startWeekDay - 1) ) ) {
        innerHTML = "";
        appendChild( createDay(this, now, this.getEvents(now)) );
        className = generateClasses(now,this.getToday(),className.split(' '));
        onclick   = (function(context, day) { 
          return function() { context.handleDaySelection(day) };
        })(this, new Date(now.getTime()));
      }
    }

    // clear trailing days
    var begin = this.getEnd().getDate() + startWeekDay;
    for( var d=begin; d<=42; d++ ) {
      with( document.getElementById( this.id + d ) ) {
        innerHTML = "";
        var classes = removeFromArray( className.split(' '), "unused", "trailing" );
        classes.push( begin <= 36 && d >= 36  ? "unused" : "trailing" );
        className = classes.join( ' ' );
      }
    }
    return this;
  };

  // method to return the events on a specific date, ordered chronologically
  cal.calendar.prototype.getEvents = function getEvents(date) {
    var key = formatDate("yyyy/m/d", date);
    var events = key in this.data ? this.data[key] : [];
    events.sort( function(a,b) {
      if( a.type == "allday" ) { return 0; }
      if( b.type == "allday" ) { return 0; }
      var re = /(\d+):(\d+)/;
      var aa = a.start.match(re);
      var bb = b.start.match(re);
      return (parseInt(aa[1])*60 + parseInt(aa[2]))
           - (parseInt(bb[1])*60 + parseInt(bb[2]));
    } );
    return events;
  };

 cal.calendar.prototype.processWith = function processWith( cb ) {
   if( typeof cb == "function" ) { this.processEvents = cb; }
   return this;
 };
  
 cal.calendar.prototype.findEvents = function findEvents( start, end ) {
   if( ! start ) { start = new Date(); } // by default start = now
   if( ! end   ) {                       // by default end = start + 1 month
     end = new Date(start.getTime());
     end.setMonth( end.getMonth() + 1 );
   }
   for( var p=0; p<this.providers.length; p++ ) {
     var provider = this.providers[p];
     provider.method.apply( provider.context, 
                            [ start, end, this.processEvents, this ] );
   }
 };
 
}(window));
