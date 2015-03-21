# Statto #

Like statsd, but different.

## Metrics ##

There are 4 different metrics types:

* counters
* timers
* gauges
* sets

## Try it out ##

```js
var statto = require('statto')

var stattoServer = statto({
  port     : 9526,
  interval : 15 * 1000, // 15s
})

stattoServer.on('stats', function(timestamp, stats) {
  console.log('timestamp :', timestamp)
  console.log('stats :', stats)
})
```

Then run the program and in another window, run this a few times (simulating when new accounts are created):

```sh
$ echo "c:account.new:1" | nc -u -w0 127.0.0.1 9526
```

See the output get logged every 15 seconds.

## Differences to Statsd ##

* statsd requires a config file in which your plugins are specified
* this is a library, not an executable
* you can write whatever backend you want, right there
* configure however you like just by passing options to the server

## ChangeLog ##

### 0.1.0 (2015-03-22) ###

* [NEW] Initial version with stats for counters, gauges, timers and meta

## Author ##

Written by [Andrew Chilton](http://chilts.org/) - [Twitter](https://twitter.com/andychilton).

Written for [Tynio](https://tyn.io/) so we can talk to all RackspaceCloud services. Please check us out for hosting
your blog/microblog/shortlink service with stats built-in. "Create, Shorten and Share Almost Anything!"

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
