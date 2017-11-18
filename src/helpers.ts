import { BehaviorSubject, Observable } from 'rxjs'
import { ValueAnimation, ValueAndMetaInfoAnimation, MetaInfo } from './interfaces'

export interface AnimatedValue<V> {
  subject: BehaviorSubject<V>,
  animated: Observable<V>,
  getValue: () => V,
  setValue: (v: V) => void
}

export interface AnimatedValueWithMetaInfo<V> extends AnimatedValue<V> {
  meta: Observable<MetaInfo<V>>,
  getMeta: () => MetaInfo<V>
}
export interface AnimatedValueCreate<V> {
  (a: ValueAnimation<V>, initialValue: V, transformFn?: (s: Observable<V>) => Observable<V>):
    AnimatedValue<V>
}

export interface AnimatedValueWithMetaInfoCreate<V> {
  (a: ValueAndMetaInfoAnimation<V>, initialValue: V, transformFn?: (s: Observable<V>) => Observable<V>):
    AnimatedValueWithMetaInfo<V>
}

export interface RibbonConfigNotAnimated {
  delay?: number,
  margin?: number,
  min?: number,
  max?: number
}

export interface RibbonConfig extends RibbonConfigNotAnimated {
  animate: ValueAnimation<number>,
}

// todo figure out how to infere number based on type of initialValue
export let createAnimatedNumber: AnimatedValueCreate<number>
createAnimatedNumber = (animation, initialValue, transformFn) => {
  const subject = new BehaviorSubject(initialValue)
  const vs = transformFn ? subject.let(transformFn) : subject
  return {
    animated: vs.let(animation),
    subject,
    getValue: () => subject.value,
    setValue: (v: typeof initialValue) => subject.next(v)
  }
}

export let createAnimatedNumberWithMetaInfo: AnimatedValueWithMetaInfoCreate<number>
createAnimatedNumberWithMetaInfo = (animation, initialValue, transformFn) => {
  const subject = new BehaviorSubject(initialValue)
  const vs = transformFn ? subject.let(transformFn) : subject
  const m = animation(vs)
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

export const ribbonValueNotAnimated = ({ min = -Infinity, max = Infinity, margin = 0, delay = 200 }: RibbonConfigNotAnimated) =>
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

export const ribbonValue = (c: RibbonConfig) =>
  (stream: Observable<number>) =>
    stream
      .let(ribbonValueNotAnimated(c))
      .let(c.animate)
