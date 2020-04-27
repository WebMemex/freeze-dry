import { DomResource } from './dom-resource'
export * from './dom-resource'

import { StylesheetResource } from './stylesheet-resource'
export * from './stylesheet-resource'

import { LeafResource } from './leaf-resource'
export * from './leaf-resource'

export type Resource = DomResource | StylesheetResource | LeafResource
