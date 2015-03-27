// --------------------------------------------------------------------------------------------------------------------
// tyn.io - (c) 2015 Tynio.
// --------------------------------------------------------------------------------------------------------------------

// core
var util = require('util')
var dgram = require('dgram')
var events = require('events')
var os = require('os')

// --------------------------------------------------------------------------------------------------------------------

var TYPES = {
  c : true,
  g : true,
  t : true,
  s : true,
}

function getPeriod(interval) {
  var period = Math.floor(Date.now() / interval) * interval
  return new Date(period)
}

function createStatsServer(opts, callback) {
  // check which options we have been given
  if ( !opts ) {
    opts = {}
  }
  if ( typeof opts === 'function') {
    callback = opts
    opts = {}
  }
  callback = callback || function() {}

  var port     = opts.port     || 9526
  var interval = opts.interval || 15 * 1000 // default: 15s
  var info = {
    pid : process.pid,
    host : os.hostname(),
  }

  // to emit 'stats' messages
  var ee = new events.EventEmitter()

  // remember which period we're currently in
  var currentPeriod
  
  // this is the data we'll use for this server
  var counters = {
    'statto.packets.total' : 0,
    'statto.msgs.total'    : 0,
    'statto.msgs.good'     : 0,
    'statto.msgs.bad'      : 0,
  }
  var timers   = {}
  var gauges   = {}
  var sets     = {}

  var server = dgram.createSocket('udp4')

  server.on("error", function (err) {
    // console.log("server error:\n" + err.stack)
    server.close()
    callback(err)
  })

  server.on('message', function (msg, rinfo) {
    ee.emit('debug', util.format('Received %d bytes from %s:%d', msg.length, rinfo.address, rinfo.port))

    // some meta stats
    counters['statto.packets.total']++

    // ToDo: convert op into multiple ops if string contains "\n"
    var op = msg.toString()
    op = op.replace(/\n$/, '')
    ee.emit('debug', 'Op = ' + op)

    // see what type of message this is:
    var parts = op.split(/:/)

    var type = parts[0]
    var key  = parts[1]
    var val  = type === 's' ? parts[2] : parts[2]|0

    counters['statto.msgs.total']++
    if ( type in TYPES ) {
      counters['statto.msgs.good']++
    }
    else {
      counters['statto.msgs.bad']++
      return
    }

    if ( type === 'c' ) {
      // this is a counter
      if ( !counters[key] ) {
        counters[key] = 0
      }
      counters[key] += val
    }
    else if ( type === 'g' ) {
      // gauge
      gauges[key] = val
    }
    else if ( type === 't' ) {
      // timer
      if ( !timers[key] ) {
        timers[key] = []
      }
      timers[key].push(val)
    }
    else if ( type === 's' ) {
      // set
      if ( !sets[key] ) {
        sets[key] = {}
      }
      if ( !sets[key][val] ) {
        sets[key][val] = 0
      }
      sets[key][val] += 1
    }
    else {
      throw new Error('Program error, unknown type ' + type)
    }
  })

  server.bind(port, function() {
    callback(null, port)
  })

  function flush() {
    // remember the last period and the stats
    var ts = currentPeriod.toISOString()
    var lastStats = {
      counters : counters,
      gauges   : gauges,
      timers   : timers,
      sets     : sets,
      info     : info,
      ts       : ts,
    }

    // process some lastStats so the backends don't have to
    var timerKeys = Object.keys(lastStats.timers)
    timerKeys.forEach(function(timer) {
      // see if we have any data
      if ( lastStats.timers[timer].length === 0 ) {
        lastStats.timers[timer] = {}
      }

      // yes, got some timings, sort them first
      var times = lastStats.timers[timer].sort(function(a, b) { return a - b })

      // calculate some stats per timer
      var data = {
        sum   : times.reduce(function(a, b) { return a + b }),
        count : times.length,
        min   : times[0],
        max   : times[times.length-1],
        times : times,
      }
      data.mean = data.sum / data.count

      // find the median
      var middle = Math.floor(data.count/2)
      // take the middle value, or the average of the middle two
      var median = (data.count % 2) ? times[middle] : (times[middle-1] + times[middle])/2
      data.median = median

      // find the standard deviation
      var sumOfDiffs = 0
      for (var i = 0; i < data.count; i++) {
        sumOfDiffs += (times[i] - data.mean) * (times[i] - data.mean)
      }
      data.std = Math.sqrt(sumOfDiffs / data.count)

      lastStats.timers[timer] = data
    })

    // now emit these on the nextTick
    process.nextTick(function() {
      ee.emit('stats', lastStats)
    })

    // reset the current stats
    counters = {
      'statto.packets.total' : 0,
      'statto.msgs.total'    : 0,
      'statto.msgs.good'     : 0,
      'statto.msgs.bad'      : 0,
    }
    timers   = {}
    gauges   = {}
    sets     = {}

    // set the new currentPeriod
    currentPeriod = getPeriod(interval)

    // figure out the next interval
    var nextPeriod = currentPeriod.getTime() + interval
    setTimeout(flush, nextPeriod - Date.now())
  }

  // set the new currentPeriod
  currentPeriod = getPeriod(interval)

  // figure out the next interval
  var nextPeriod = currentPeriod.getTime() + interval
  setTimeout(flush, nextPeriod - Date.now())

  return ee
}

// --------------------------------------------------------------------------------------------------------------------

module.exports = createStatsServer

// --------------------------------------------------------------------------------------------------------------------
