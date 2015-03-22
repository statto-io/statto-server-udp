// --------------------------------------------------------------------------------------------------------------------
// tyn.io - (c) 2015 Tynio.
// --------------------------------------------------------------------------------------------------------------------

// core
var util = require('util')
var dgram = require('dgram')
var events = require('events')

// --------------------------------------------------------------------------------------------------------------------

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

  // to emit 'stats' messages
  var ee = new events.EventEmitter()

  // remember which period we're currently in
  var currentPeriod
  
  // this is the data we'll use for this server
  var counters = {}
  var timers   = {}
  var gauges   = {}
  var meta = {
    received : 0,
    bad      : 0,
  }

  var server = dgram.createSocket('udp4')

  server.on("error", function (err) {
    // console.log("server error:\n" + err.stack)
    server.close()
    callback(err)
  })

  server.on('message', function (msg, rinfo) {
    ee.emit('debug', util.format('Received %d bytes from %s:%d', msg.length, rinfo.address, rinfo.port))

    // some meta stats
    meta.received++

    // ToDo: convert op into multiple ops if string contains "\n"
    var op = msg.toString()
    op = op.replace(/\n$/, '')
    ee.emit('debug', 'Op = ' + op)

    // see what type of message this is:
    var parts = op.split(/:/)

    var type = parts[0]
    var key  = parts[1]
    var val  = parseInt(parts[2], 10)

    // if there is no key, log it as bad
    if ( !key ) {
      return meta.bad++
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
    else {
      // ee.emit('bad', op)
      meta.bad++
    }
  })

  server.bind(port, function() {
    callback(null, port)
  })

  function flush() {
    // remember the last period and the stats
    var lastPeriodStr = currentPeriod.toISOString()
    var lastStats = {
      counters : counters,
      meta     : meta,
      gauges   : gauges,
      timers   : timers,
    }

    // now emit these on the nextTick
    process.nextTick(function() {
      ee.emit('stats', lastPeriodStr, lastStats)
    })

    // reset the current stats
    counters = {}
    timers = {}
    // Note: gauges are not reset!
    meta = {
      received : 0,
      bad      : 0,
    }

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
