import { createSelector } from 'reselect'
import _ from 'lodash'

const getPositionState = state => state.position
const getMapState = state => state.map
const getFeaturesState = state => state.features

export default createSelector(
  getPositionState,
  getMapState,
  getFeaturesState,
  (position, map, features) => {
    return {
      position,
      map,
      features,
    }
  }
)
