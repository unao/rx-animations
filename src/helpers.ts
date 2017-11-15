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

// todo figure out how to infere number based on type of initialValue
let createAnimatedNumber: AnimatedValue<number>
createAnimatedNumber = (animation, initialValue) => {
  const subject = new BehaviorSubject(initialValue)
  return {
    animated: subject.let(animation),
    subject,
    getValue: () => subject.value,
    setValue: (v: typeof initialValue) => subject.next(v)
  }
}

let createAnimatedNumberWithMetaInfo: AnimatedValueAndMetaInfo<number>
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

export {
  createAnimatedNumber,
  createAnimatedNumberWithMetaInfo
}
