import { expect } from 'chai'

import { createAnimatedNumber, createAnimatedNumberWithMetaInfo } from './helpers'

import { Observable } from 'rxjs'
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
      .takeUntil(meta
          .skip(2) // initially not animating
          .filter(m => !m.isAnimating)
        )
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
})
