import { Observable } from 'rxjs'

export interface MetaInfo<V> {
  from: V,
  to: V,
  isAnimating: boolean,
  progress?: number
}

export interface ValueBinding<V,O> {
  (options: O): (source: Observable<V>) => Observable<V>
}

export interface ValueAndMetaInfoBinding<V,O> {
  (options: O): (source: Observable<V>) => ({
    values: Observable<V>,
    meta: Observable<MetaInfo<V>>
  })
}
