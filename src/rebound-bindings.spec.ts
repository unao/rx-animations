import { expect } from 'chai'

import { Observable } from 'rxjs'
import { reboundValue } from './rebound-bindings'

describe('rebound-bindings', () => {
  describe('reboundValue', () => {

    it('should animate stream of values', (done) => {
      const startValue = 1000
      const firstTarget = -100
      const finalTarget = 2500

      const stream = Observable.of(firstTarget)
        .merge(Observable.timer(50)
          .map(() => finalTarget)
        )
        .startWith(startValue)

      stream
        .let(reboundValue({ config: { restSpeedThreshold: 12, restDisplacementThreshold: 1 } }))
        .scan((acc, v) => {
          acc.push(v)
          return acc
        }, [])
        .debounceTime(100)
        .take(1)
        .subscribe((v) => {
          expect(v.length).to.be.at.least(10)
          const first = v.shift()
          const last = v.pop()
          expect(first).to.equal(startValue)
          expect(last).to.equal(finalTarget)
          done()
        })
    })
  })
})
