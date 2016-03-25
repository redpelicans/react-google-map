import { createSelector } from 'reselect'
import _ from 'lodash'

const getPositionState = state => state.position
const getMapState = state => state.map

export default createSelector(
  getPositionState,
  getMapState,
  (position, map) => {
    return {
      position,
      map,
    }
  }
)
