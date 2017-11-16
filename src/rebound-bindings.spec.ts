import { expect } from 'chai'

import * as Rx from 'rxjs'
import { SpringSystem } from 'rebound'

import { reboundValue, reboundValueWithMeta } from './rebound-bindings'

describe('rebound-bindings', () => {

  const Observable = Rx.Observable
  const springSystem = new SpringSystem()
  const animate = reboundValue({ Rx, springSystem })
  const animateWithMeta = reboundValueWithMeta({ Rx, springSystem })

  it('should animate stream of values', (done) => {
    const startValue = 1000
    const firstTarget = -100
    const finalTarget = 2500

    const stream = Observable.merge(
      Observable.timer(20).mapTo(startValue),
      Observable.timer(70).mapTo(firstTarget),
      Observable.timer(100).mapTo(finalTarget)
    )

    stream
      .let(animate({ restSpeedThreshold: 4, restDisplacementThreshold: 0.5 }))
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

  it('should animate stream of values with meta', (done) => {
    const startValue = 100
    const firstTarget = -100
    const finalTarget = 250

    const config = { restSpeedThreshold: 12, restDisplacementThreshold: 1 }

    const stream = Observable.of(firstTarget)
      .merge(Observable.timer(50)
        .map(() => finalTarget)
      )
      .startWith(startValue)

    stream
      .let(s =>
        Observable.of(animateWithMeta(config)(s)))
      .mergeMap(({ values, meta }) =>
        Observable.merge(
          Observable.timer(0).mergeMapTo(values.map(value => ({ value }))),
          meta.map(meta => ({ meta }))
        )
      )
      .scan((acc, v: any) => {
        if (v.value) {
          acc[0].push(v.value)
        } else {
          acc[1].push(v.meta)
        }
        return acc
      }, [[NaN], []]) // NaN for suppress ts 'never'
      .debounceTime(1500)
      .take(1)
      .subscribe(([vs, metas]) => {
        vs.shift() // NaN
        expect(vs.length).to.be.at.least(10)
        const first = vs.shift()
        const last = vs.pop()
        expect(first).to.equal(startValue)
        expect(last).to.equal(finalTarget)
        expect(metas.map(m => (m as any).isAnimating)).to.eql([false, false, true, true, false])
        done()
      })
  })

})
