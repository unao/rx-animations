import * as Rx from 'rxjs'
import { SpringSystem, Spring, SpringConfig, RGB } from 'rebound'

import { ValueBinding, ValueAndMetaInfoBinding, MetaInfo } from './interfaces'

export interface Config {
  tension?: number,
  friction?: number,
  restSpeedThreshold?: number,
  restDisplacementThreshold?: number,
  overshootClamping?: boolean
}

export interface Deps {
  Rx: typeof Rx,
  springSystem: SpringSystem,
  defaultConfig?: Config
}

const getConfig = (defaultConfig?: Config, config?: Config): Config =>
  Object.assign(
    {},
    defaultConfig || SpringConfig.DEFAULT_ORIGAMI_SPRING_CONFIG,
    config || {}
  )

const subjectFromListener = (spring: Spring, callback: string) => {
  const s = new Rx.Subject()
  spring.addListener({
    [callback]: () => s.next()
  })
  return s
}

let reboundValue: (deps: Deps) => ValueBinding<number, Config>
reboundValue = ({ Rx, springSystem, defaultConfig }) => (config?) => (stream) =>
  Rx.Observable.create(observer => {
    const cfg = getConfig(defaultConfig, config)
    const spring = springSystem.createSpring(cfg.tension, cfg.friction)

    if (cfg.restSpeedThreshold) {
      spring.setRestSpeedThreshold(cfg.restSpeedThreshold)
    }
    if (cfg.restDisplacementThreshold) {
      (spring as any).setRestDisplacementThreshold(cfg.restDisplacementThreshold)
    }

    spring.setOvershootClampingEnabled(cfg.overshootClamping || false)

    const update = subjectFromListener(spring, 'onSpringUpdate')
    const atRest = subjectFromListener(spring, 'onSpringAtRest')

    const first$ = stream
      .take(1)
      .do(v => spring.setCurrentValue(v))

    const rest$ = stream
      .skip(1)
      .do(v => spring.setEndValue(v))
      .switchMap(() => update
        .map(() => spring.getCurrentValue())
        .takeUntil(atRest)
      )

    const sub = first$.merge(rest$)
      .subscribe(observer)

    return () => {
      sub.unsubscribe()
      // it seems there might some race condition (most likely in rebound lib)
      setTimeout(() => spring.destroy(), 0)
    }
  })

let reboundValueWithMeta: (deps: Deps) => ValueAndMetaInfoBinding<number, Config>
reboundValueWithMeta = ({ Rx, springSystem, defaultConfig }) => (config?) => (stream) => {
  const meta = new Rx.BehaviorSubject<MetaInfo<number>>({ from: NaN, to: NaN, isAnimating: false })

  const values = Rx.Observable.create(observer => {
    const cfg = getConfig(defaultConfig, config)
    const spring = springSystem.createSpring(cfg.tension, cfg.friction)

    if (cfg.restSpeedThreshold) {
      spring.setRestSpeedThreshold(cfg.restSpeedThreshold)
    }
    if (cfg.restDisplacementThreshold) {
      (spring as any).setRestDisplacementThreshold(cfg.restDisplacementThreshold)
    }

    spring.setOvershootClampingEnabled(cfg.overshootClamping || false)

    const update = subjectFromListener(spring, 'onSpringUpdate')
    const atRest = subjectFromListener(spring, 'onSpringAtRest')

    const first$ = stream
      .take(1)
      .do(v => meta.next({ to: v, from: v, isAnimating: false }))
      .do(v => spring.setCurrentValue(v))

    const rest$ = stream
      .skip(1)
      .do(v => meta.next({ from: spring.getCurrentValue(), to: v, isAnimating: true }))
      .do(v => spring.setEndValue(v))
      .switchMap(v => update
        .map(() => spring.getCurrentValue())
        .takeUntil(atRest
          .do(() => meta.next({ from: v, to: v, isAnimating: false }))
        )
      )

    const sub = first$.merge(rest$)
      .subscribe(observer)

    return () => {
      sub.unsubscribe()
      meta.complete()
      setTimeout(() => spring.destroy(), 0)
    }
  })

  return {
    values,
    meta: meta.asObservable(),
    getMeta: () => meta.value
  }
}

export {
  reboundValue,
  reboundValueWithMeta
}
