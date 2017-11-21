[![Build Status](https://travis-ci.org/unao/rx-animations.svg?branch=master)](https://travis-ci.org/unao/rx-animations)

# [Demo](https://rx-animations-demo.firebaseapp.com/)

[WIP]

# Why?

[WIP]

The aim for this library is to create bindings between RxJS and animation libraries.
On one hand it upgrades animation libraries api to an Observable interface, but 
additionally it allows smooth interruption of currently animating values.
The binding may be hooked up to any stream, making it really easy to turn on/off
animations based on a setting.

Let say we have a following stream:

```javascript
const stream = Observable.of(100, 0)
  .merge(Observable.timer(100).map(() => 200))
```

Normally - once subscribed - `stream` will produce following values:

```javascript
// 100
// 0
// 200 after 100ms
```

With a binding we can smooth out emitting of the values:

```javascript
stream.let(someBinding())
```

Now, the stream stream emission will look something like that:

```javascript
// 100 -- animating from 100 to 0

// 90 after 16ms
// 82 after 32ms
// 75 after 48ms
// 69 after 64ms
// 62 after 80ms
// 50 after 96ms

// 100ms - the underlinging stream emitted 200 - so the 100 to 0 animation got interrupted
// and now the binding will make sure to smoothly animate from current value (50) to 200

// 70 after 116ms
// 85 after 132ms
// ...
// 200 once the animation completed probably after ~300ms
```

# License 

[MIT](./LICENSE)