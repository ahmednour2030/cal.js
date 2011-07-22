var Cal = { 
  // public factory method
  activate : function activate(id) {
    return new Cal.calendar(id);
  }

  // a private implementation, no direct instantiation (no special reason)
, calendar : Class.extend( {

    init: function init(id) {
      this.id = id;
      this.getData              = function() { return {} };
      this.handleDaySelection   = function() { };
      this.handleEventSelection = function() { };
    }

  , useDataProvider: function useDataProvider(callback) { 
      if( typeof callback == "function" ) { 
        this.getData = callback;
      }
      return this;
    }

  , notifyOfDaySelection: function notifyOfDaySelection(callback) { 
      if( typeof callback == "function" ) { 
        this.handleDaySelection = callback; 
      }
      return this;
    }

  , notifyOfEventSelection: function notifyOfEventSelection(callback) { 
      if( typeof callback == "function" ) { 
        this.handleEventSelection = callback;
      }
      return this;
    }

  , gotoNextMonth: function gotoNextMonth() {
      this.today.setMonth(this.today.getMonth() + 1);
      this.render();
      this.handleDaySelection(this.today);
    }

  , gotoPreviousMonth: function gotoPreviousMonth() {
      this.today.setMonth(this.today.getMonth() - 1);
      this.render();
      this.handleDaySelection(this.today);
    }

  , gotoDate: function gotoDate(date) {
      if( ! this.today || ! this._isSameDay(date, this.today ) ) {
        this.today = date ? new Date( date.getTime() ) : new Date();
        this.render();
        this.handleDaySelection(this.today);
      }
    }
    
  , gotoToday: function gotoToday() {
    this.gotoDate( new Date() );
  }

  , _getDate: function _getDate() {
    if( ! this.today ) { this.gotoDate(); }
    return new Date(this.today.getTime());
  }

  , render: function render() {
    var start = this._getDate(); 
        start.setDate(1);
    var end   = this._getDate();
        end.setDate( this._daysInMonth( this.today.getMonth(), 
                                        this.today.getFullYear() ) );
    var startWeekDay = start.getDay();
    startWeekDay = startWeekDay <= 0 ? 7 : startWeekDay; // move Sunday to end

    var data = this.getData(start, end);

    // clear leading days
    for( var d=1;d<=startWeekDay;d++ ) {
      with( document.getElementById( this.id + d ) ) {
        innerHTML = "";
        className = "leading";
      }
    }

    // actual days in this month
    var now = new Date(start.getTime());
    for( var d=1;d<=end.getDate();d++) {
      now.setDate(d);
      with( document.getElementById( this.id + (d + startWeekDay - 1) ) ) {
        innerHTML = "";
        appendChild( this._createDay(now, this.getEvents(now)) );
        className = this._generateClasses(now);
        onclick   = (function(day) { 
          return function() { this.handleDaySelection(day) }.scope(this);
        }.scope(this))(new Date(now.getTime()));
      }
    }

    // clear trailing days
    var begin = end.getDate()+startWeekDay;
    for( var d=begin;d<=42;d++ ) {
      with( document.getElementById( this.id + d ) ) {
        innerHTML = "";
        className = begin <= 36 && d >= 36  ? "unused" : "trailing";
      }
    }
    return this;
  }

  , _formatDate: function _formatDate(format, date) {
    // TODO add all possible formats, now only the one we use ;-)
    return format.replace(    "d", date.getDate()     )
                 .replace(    "m", date.getMonth() +1 )
                 .replace( "yyyy", date.getFullYear() );
  }

  , _createDay: function _createDay(day, events) {
    var container = document.createElement("DIV");
    container.className = "container";
    
    // create date header
    var date = document.createElement("DIV");
    date.className = "number";
    date.innerHTML = day.getDate();
    container.appendChild(date);
    
    // add events
    events.iterate( function( event ) {
      var elem = document.createElement("DIV");
      elem.className = event.type + " event " + event.calendar;
      elem.onclick = (function(ev) { 
        return function(e) {
          this.handleEventSelection(ev, elem);
          if( !e ) { var e = window.event; }
	        e.cancelBubble = true;
	        if( e.stopPropagation ) { e.stopPropagation(); }
        }.scope(this)
      }.scope(this))(event);
      var subject = ( event.type == "timed" ? event.start + " " : "" ) +  event.subject;
      elem.innerHTML = subject;
      container.appendChild(elem);
    }.scope(this) );

    return container;
  }
  
  , getEvents: function getEvents(date) {
      var key = this._formatDate("d-m-yyyy", date);
      return key in data ? data[key] : [];
    }

  , _generateClasses: function generateClasses(day) {
    var classes = [];
    var now = new Date();
    if( this._isSameDay(day, now) ) {
      classes.push( "today" );
    }
    if( this._isSameDay(day, this.today) ) {
      classes.push( "selected" );
    }
    return classes.join( " " );
  }

  , _isSameDay: function _isSameDay(day1, day2) {
    return this._formatDate("d-m-yyyy", day1) 
        == this._formatDate("d-m-yyyy", day2);
  }

  , _daysInMonth: function _daysInMonth(month, year) {
	  return 32 - new Date(year, month, 32).getDate();
  }

} )
};
