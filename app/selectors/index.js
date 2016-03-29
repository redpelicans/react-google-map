import { createSelector } from 'reselect'
import _ from 'lodash'

const getPositionState = state => state.position
const getMapState = state => state.map
const getFeaturesState = state => state.features
const getDisplayMaskState = state => state.displayMask

export default createSelector(
  getPositionState,
  getMapState,
  getFeaturesState,
  getDisplayMaskState,
  (position, map, features, displayMask) => {
    return {
      position,
      map,
      features,
      displayMask,
    }
  }
)
