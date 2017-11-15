import { BehaviorSubject, Observable } from 'rxjs'
import { ValueAnimation, ValueAndMetaInfoAnimation, MetaInfo } from './interfaces'

export interface AnimatedValue<V> {
  (a: ValueAnimation<V>, initialValue: V): {
    subject: BehaviorSubject<V>,
    animated: Observable<V>,
    getValue: () => V,
    setValue: (v: V) => void
  }
}

export interface AnimatedValueAndMetaInfo<V> {
  (a: ValueAndMetaInfoAnimation<V>, initialValue: V): {
    subject: BehaviorSubject<V>,
    animated: Observable<V>,
    meta: Observable<MetaInfo<V>>,
    getValue: () => V,
    setValue: (v: V) => void,
    getMeta: () => MetaInfo<V>
  }
}

export interface RibbonConfig {
  animate: ValueAnimation<number>,
  delay?: number,
  margin?: number,
  min?: number,
  max?: number
}

// todo figure out how to infere number based on type of initialValue
export let createAnimatedNumber: AnimatedValue<number>
createAnimatedNumber = (animation, initialValue) => {
  const subject = new BehaviorSubject(initialValue)
  return {
    animated: subject.let(animation),
    subject,
    getValue: () => subject.value,
    setValue: (v: typeof initialValue) => subject.next(v)
  }
}

export let createAnimatedNumberWithMetaInfo: AnimatedValueAndMetaInfo<number>
createAnimatedNumberWithMetaInfo = (animation, initialValue) => {
  const subject = new BehaviorSubject(initialValue)
  const m = animation(subject)
  return {
    animated: m.values,
    meta: m.meta,
    subject,
    getValue: () => subject.value,
    setValue: (v: typeof initialValue) => subject.next(v),
    getMeta: m.getMeta
  }
}

export const nextAnimationDone = (meta: Observable<MetaInfo<any>>) =>
  meta
    .filter(m => m.isAnimating)
    .switchMapTo(meta
      .filter(m => !m.isAnimating))

export const ribbonValue = ({ animate, min = -Infinity, max = Infinity, margin = 0, delay = 200 }: RibbonConfig) =>
  (stream: Observable<number>) =>
    stream
      .switchMap(v => {
        if (v < min) {
          return Observable.of(Math.max(v, min - margin))
            .merge(Observable.of(min).delay(delay))
        } else if (v > max) {
          return Observable.of(Math.min(v, max + margin))
            .merge(Observable.of(max).delay(delay))
        }
        return Observable.of(v)
      })
      .let(animate)
