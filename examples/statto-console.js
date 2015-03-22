var statto = require('../statto.js')

var opts = {
  port     : 9526,
  interval : 15 * 1000,
}

var stattoServer = statto(opts, function(err, port) {
  console.log('Stats server is listening on port %s', port)
})

stattoServer.on('stats', function(timestamp, stats) {
  console.log('--- %s ---', timestamp)
  console.log(JSON.stringify(stats, null, 2))
})
