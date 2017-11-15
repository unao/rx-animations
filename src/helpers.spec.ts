import { expect } from 'chai'

import { createAnimatedNumber, createAnimatedNumberWithMetaInfo, ribbonValue, nextAnimationDone } from './helpers'

import { Observable, BehaviorSubject } from 'rxjs'
import { reboundValue, reboundValueWithMeta } from './rebound-bindings'

describe('helpers', () => {
  it('should create animatedNumber', (done) => {
    const { subject, animated, getValue, setValue } = createAnimatedNumber(reboundValue(), 0)
    const final = 100
    const startSubject = subject.value
    const startGet = getValue()
    setTimeout(() => setValue(final), 0)
    return animated
      .take(15)
      .last()
      .subscribe(x => {
        expect(startSubject).to.equal(0)
        expect(startGet).to.equal(0)
        expect(x).to.be.above(50)
        expect(final).to.equal(getValue())
        expect(final).to.equal(subject.value)
        done()
      })
  })

  it('should create animatedNumberWithMetaInfo', (done) => {
    const { subject, meta, animated, getValue, setValue, getMeta } =
      createAnimatedNumberWithMetaInfo(reboundValueWithMeta(), 0)
    const final = 100
    const startSubject = subject.value
    const startGet = getValue()
    setTimeout(() => setValue(final), 0)
    return animated
      // .do(x => console.log('ANIMI', x))
      .takeUntil(nextAnimationDone(meta))
      .last()
      .subscribe(x => {
        expect(startSubject).to.equal(0)
        expect(startGet).to.equal(0)
        expect(x).to.be.above(50)
        expect(final).to.equal(getValue())
        expect(final).to.equal(subject.value)
        done()
      })
  })

  it('ribbonValue lower bound', (done) => {
    const value = new BehaviorSubject(0)
    setTimeout(() => value.next(-250), 0)
    value
      .let(ribbonValue({ animate: reboundValue(), min: 0, margin: 50, delay: 200 }))
      .scan((acc: Array<number>, x) => acc.concat([x]), [])
      .debounceTime(100)
      .take(1)
      .subscribe((x) => {
        expect(x[x.length - 1]).to.equal(0)
        Observable.from(x)
          .min()
          .subscribe(x => {
            expect(x).to.be.below(-45)
            expect(x).to.be.above(-50.00001)
          })
        done()
      })
  })

  it('ribbonValue upper bound', (done) => {
    const value = new BehaviorSubject(0)
    setTimeout(() => value.next(250), 0)
    value
      .let(ribbonValue({ animate: reboundValue(), max: 100, margin: 50, delay: 200 }))
      .scan((acc: Array<number>, x) => acc.concat([x]), [])
      .debounceTime(100)
      .take(1)
      .subscribe((x) => {
        expect(x[x.length - 1]).to.equal(100)
        Observable.from(x)
          .max()
          .subscribe(x => {
            expect(x).to.be.below(150.0001)
            expect(x).to.be.above(140)
          })
        done()
      })
  })
})
