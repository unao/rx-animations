import { Observable } from 'rxjs'

export interface MetaInfo<V> {
  from: V,
  to: V,
  isAnimating: boolean,
  progress?: number
}

export interface ValueAnimation<V> {
  (source: Observable<V>): Observable<V>
}

export interface ValueBinding<V,O> {
  (options?: O): ValueAnimation<V>
}

export interface ValueAndMetaInfoAnimation<V> {
  (source: Observable<V>): {
    values: Observable<V>,
    meta: Observable<MetaInfo<V>>,
    getMeta: () => MetaInfo<V>
  }
}

export interface ValueAndMetaInfoBinding<V,O> {
  (options?: O): ValueAndMetaInfoAnimation<V>
}
