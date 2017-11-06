import * as Rx from 'rxjs'
import { SpringSystem, Spring, SpringConfig, RGB } from 'rebound'

import { ValueBinding } from './interfaces'

export interface Config {
  tension?: number,
  friction?: number,
  restSpeedThreshold?: number,
  restDisplacementThreshold?: number,
  overshootClamping?: boolean
}

export interface Options {
  springSystem?: SpringSystem,
  config?: Config
}

const sharedSpringSystem = new SpringSystem()
const getConfig = (config?: Config): Config =>
  Object.assign(
    {},
    SpringConfig.DEFAULT_ORIGAMI_SPRING_CONFIG,
    config
  )

const subjectfromListener = (spring: Spring, callback: string) => {
  const s = new Rx.Subject()
  spring.addListener({
    [callback]: () => s.next()
  })
  return s
}

let reboundValue: ValueBinding<number, Options>
reboundValue = (options: Options) => (stream: Rx.Observable<number>) =>
  Rx.Observable.create(observer => {
    const springSystem = options.springSystem || sharedSpringSystem
    const config = getConfig(options.config)
    const spring = springSystem.createSpring(config.tension, config.friction)

    if (config.restSpeedThreshold) {
      spring.setRestSpeedThreshold(config.restSpeedThreshold)
    }
    if (config.restDisplacementThreshold) {
      (spring as any).setRestDisplacementThreshold(config.restDisplacementThreshold)
    }

    spring.setOvershootClampingEnabled(config.overshootClamping || false)

    const update = subjectfromListener(spring, 'onSpringUpdate')
    const atRest = subjectfromListener(spring, 'onSpringAtRest')

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
      spring.destroy()
    }
  })

export {
  reboundValue
}
