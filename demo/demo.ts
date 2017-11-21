import * as Rx from 'rxjs'
import { SpringSystem } from 'rebound'

import { reboundValue, reboundValueWithMeta } from '../src/rebound-bindings'
import { createAnimatedNumber, createAnimatedNumberWithMetaInfo, ribbonValue, nextAnimationDone } from '../src/helpers'
import { AnimationFrameScheduler } from 'rxjs/scheduler/AnimationFrameScheduler'

const RANGE_WIDTH = 320
const $ = Rx.Observable
const springSystem = new SpringSystem()
const animate = reboundValue({ Rx, springSystem })
const animateWithMeta = reboundValueWithMeta({ Rx, springSystem })

const randomNumber = (min, max) => () => min + (max - min) * Math.random()
const randomInt = (min, max) => () => Math.round(min + (max - min) * Math.random())
const next = randomNumber(-1000, 1000)

const color = () => `rgba(${randomInt(0, 255)()},${randomInt(0, 255)()},${randomInt(0, 255)()},${Math.random()})`

const randomDiv = ({ width = randomInt(100, 800)(), height = randomInt(200, 600)() } = {}) =>
  `<div style="background-color:${color()};width:${width}px;height:${height}px"></div>`

const query = el => className => el.querySelector(`.${className}`) || {} as any

const rangeHandler = query => (className: string, width: number, left: number, initValue?: number):
  [Rx.Observable<number>, HTMLInputElement, HTMLDivElement] => {
  const range = query(className)
  range.style.width = `${width}px`
  range.style.marginLeft = `${left}px`
  const content = query(`${className}-content`) || {} as any
  return [
    $.fromEvent(range, 'change')
      .map((e: any) => e.target.valueAsNumber)
      .startWith(initValue || range.valueAsNumber)
      .do(v => (content.innerHTML = v)),
    range,
    content
  ]
}

// VALUE
const value = () => {
  const rangeH = rangeHandler(query(document.querySelector('.value-ani')))
  return $.combineLatest(
    rangeH('min', RANGE_WIDTH / 2, 0, -500)[0],
    rangeH('max', RANGE_WIDTH / 2, RANGE_WIDTH / 2, 500)[0]
  )
    .switchMap(([min, max]) => {
      const [vs, range, content] = rangeH('value', RANGE_WIDTH, 0)
      return vs
        .let(ribbonValue({
          animate: animate(),
          margin: 200,
          delay: 500,
          max,
          min
        }))
        .do(v => {
          content.innerHTML = range.value = `${v}`
        })
    })
}

const boundValue = (min, max) => v => Math.min(Math.max(min, v), max)

const scroll = () => {
  const width = 480
  const height = 1024
  const scrollMargin = 64

  const el = document.querySelector('.scroll') as HTMLElement
  el.innerHTML = '<div></div>'
  const root = el.firstChild as HTMLElement
  root.style.position = 'relative'
  Object.assign(el.style, {
    position: 'relative',
    border: 'solid 1px gray',
    padding: `10px`,
    width: `${width}px`,
    height: `${height}px`,
    overflowY: 'hidden'
  })

  return $.range(0, 8)
    .do(() => root.insertAdjacentHTML('beforeend', randomDiv({ width })))
    .last()
    .map(() => boundValue(-scrollMargin, el.scrollHeight - height + scrollMargin))
    .mergeMap(boundScroll =>
      $.fromEvent<MouseWheelEvent>(el, 'mousewheel')
        .do(e => e.preventDefault())
        .scan((acc, e) => boundScroll(acc + e.deltaY), 0)
        .startWith(0)
        .let(ribbonValue({
          animate: animate(),
          min: 0,
          max: el.scrollHeight - height - 20,
          margin: scrollMargin
        }))
        .do(x => console.log('Y', x))
        .do(y => root.style.transform = `translate(0,${-y}px)`)
    )
}

$.merge(
  value(),
  scroll()
).subscribe()
