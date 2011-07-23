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

  // regexp to parse GitHub date format: 2011-07-22T06:45:09-07:00
  regexp = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{2}):\d{2}/,

  // process incoming data from GitHub and transform it into a list of events
  process = function process( from, to, callback, context ) {
    return function (data) {
      var events = {};
      var count = data.commits.length;
      for( var c=0; c<count; c++ ) {
        var commit = data.commits[c];
        var m = commit.committed_date.match(regexp);
        var date = new Date( parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]), 
                             parseInt(m[4]) - parseInt(m[7]),
                             parseInt(m[5]), parseInt(m[6]), 0 );
        if( date >= from && date <= to ) {
          var day = date.getDate() + "-" + (date.getMonth()+1) + "-" 
                  + date.getFullYear();
          var hour = date.getHours() + ":" + date.getMinutes();
          if( typeof events[day] == "undefined" ) { events[day] = [] };
          events[day].push( {
            type : "timed",
            start: hour,
            end: hour,
            subject: commit.message,
            calendar: "github"
          } );
        }
      }
      callback.apply( context, [events] );
    }
  },

  provider = globals.Cal.providers.github = {};
  
  provider.connect = function connect( user, repo, branch ) {
    return new provider.connection( user, repo, branch );
  };
  
  provider.connection = function connection( user, repo, branch ) {
    this.user   = user;
    this.repo   = repo;
    this.branch = branch || "master";
  };

  provider.connection.prototype.getData = function getData( from, to, cb, ctx ) {
    gh.commit.forBranch( this.user, this.repo, this.branch, 
                         process(from, to, cb, ctx), ctx );
  };

})(window);
