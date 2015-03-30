# Statto #

A statsd-like library (not daemon) - easier to configure and run.

## Metrics ##

There are 4 different metrics types:

* counters
* timers
* gauges
* sets

## Try it out ##

```js
var statto = require('statto')

var opts = {
  port     : 9526,      // default: 9526
  interval : 30 * 1000, // 30s. default: 15s
}

var stattoServer = statto(opts, function(err, port) {
  console.log('Stats server is listening on port %s', port)
})

stattoServer.on('stats', function(stats) {
  // includes keys such as:
  // * ts       - string: this period's timestamp
  // * info     - object: containing pid and host(name)
  // * counters - object: containing all counters in this period
  // * gauages  - object: containing all gauges in this period
  // * timers   - object: containing all timers in this period
  // * sets     - object: containing all sets in this period
  console.log('stats :', stats)
})
```

Then run the program and in another window, run these commands a few times each (simulating when new accounts are
created or deleted):

```sh
echo "c:account.created:1" | nc -u -w0 127.0.0.1 9526
echo "c:account.deleted:1" | nc -u -w0 127.0.0.1 9526
```

See the output get logged every 15 seconds.

Some other stats could be:

```sh
# Counters: web and api hits
echo "c:web.hit:1" | nc -u -w0 127.0.0.1 9526
echo "c:api.hit:1" | nc -u -w0 127.0.0.1 9526

# Gauge: free memory
echo "g:memory.free:1321340928" | nc -u -w0 127.0.0.1 9526

# Timer: request duration
echo "t:request.duration:94" | nc -u -w0 127.0.0.1 9526
echo "t:request.duration:81" | nc -u -w0 127.0.0.1 9526
echo "t:request.duration:89" | nc -u -w0 127.0.0.1 9526

# Set: unique IPs
echo "s:ip-address:192.168.0.1" | nc -u -w0 127.0.0.1 9526
```

## Multiple Stats ##

Stats can be sent at once using a newline delimiter

```sh
$ echo "t:request.duration:94
c:api.hit:1
g:memory.free:1321340928" | nc -u -w0 127.0.0.1 9526
```

Or just use `\n` in your strings in whatever programming language you are using.

## Examples ##

Run the example from the repo like:

```sh
node examples/statto-console.js
Stats server is listening on port 9526
```

Then fire some stats at it as above.

## Differences to Statsd ##

* statsd requires a config file in which your plugins are specified
* this is a library, not an executable
* you can write whatever backend you want, right there
* configure however you like just by passing options to the server

## See Also ##

Since statto is a stats framework, this repo only contains the collector and it only emits the raw stats. The following
repos help process and view them:

* http://npm.im/statto-merge
* http://npm.im/statto-process
* http://npm.im/statto-backend-leveldb

## ChangeLog ##

### 0.3.0 (2015-03-30) ###

* [NEW] Just output the raw stats which haven't had anay processing done on them
* [NEW] Add ability to process multiple stats in one packet
* [FIX] Fix count of packets and ops (good, bad, etc)
* [NEW] Add sets and stats related to each set
* [NEW] Add stats related to each timer
* [FIX] Make sure last field is a number (for non-sets)
* [NEW] Include meta, ts and info in the stats

### 0.1.0 (2015-03-22) ###

* [FIX] Increment bad ops if key not given
* [NEW] Allow new opts object in constructor
* [NEW] Allow optional callback to constructor

### 0.1.0 (2015-03-22) ###

* [NEW] Initial version with stats for counters, gauges, timers and meta

## Author ##

Written by [Andrew Chilton](http://chilts.org/) - [Twitter](https://twitter.com/andychilton).

Written for [Tynio](https://tyn.io/) so we can use a statsd-like daemon in a much easier way. Our use-case involves a
stats callback which writes each file to Rackspace's Cloud Files, which are aggregated in a separate process elsewhere.
ie. the stats daemon is not where the hard work is, it's pretty easy.

## License ##

The MIT License (MIT)

Copyright 2015 Tynio Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

(Ends)
