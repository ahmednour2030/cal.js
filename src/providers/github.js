// make sure that the Cal global namespace exists
if( ! Cal ) {
  alert( "Can't find a global Cal namespace.\n" +
  "Include https://github.com/christophevg/cal.js in your project." );
}

// check that the global gh namespace exists
if( ! gh || ! gh.commit ) {
  alert( "Can't find a global gh namespace.\n" +
  "Include https://github.com/fitzgen/github-api in your project." );
}

(function (globals) {

  var

  // fetches the entire history
  fetchHistory = function fetchHistory() {
    gh.commit.forBranch( this.user, this.repo, this.branch, cache, this );
  },
  
  // cache commits locally
  cache = function cache(data) {
    this.history = data.commits;
  },

  select = function select( start, end ) {
    var events = {};
    var count = this.history.length;
    for( var c=0; c<count; c++ ) {
      var commit = this.history[c];
      var date   = new Date( commit.committed_date );
      if( date >= start && date <= end ) {
        var day  = date.getFullYear() + "/" + (date.getMonth()+1) + "/" 
        + date.getDate();
        var hour = date.getHours() + ":" + date.getMinutes();
        if( typeof events[day] == "undefined" ) { events[day] = [] };
        events[day].push( {
          type    : "timed",
          start   : hour,
          end     : hour,
          subject : commit.message,
          calendar: this.repo
        } );
      }
    }
    return events;
  },

  provider = globals.Cal.providers.github = {};
  
  provider.connect = function connect( user, repo, branch ) {
    return new provider.connection( user, repo, branch );
  };
  
  provider.connection = function connection( user, repo, branch ) {
    this.user    = user;
    this.repo    = repo;
    this.branch  = branch || "master";
    // fetch entire history as a cache
    fetchHistory.apply(this);
  };

  // select the correct subset from the history and return it as an eventlist
  provider.connection.prototype.getData = 
    function getData( start, end, cb, ctx ) {
      // while the history hasn't been cached, ... try again
      if( ! this.history ) {
        return setTimeout( (function(context) { 
          return function() {
            context.getData( start, end, cb, ctx );
          } })(this)
          , 100 );
      }
      var events = select.apply( this, [ start, end ] );
      cb.apply(ctx, [ events ] );
    };
    
})(window);
