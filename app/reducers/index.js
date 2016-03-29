import _ from 'lodash'
import turf from 'turf'
import { combineReducers } from 'redux'

const initialPosition = {
  bounds: undefined,
  marginBounds: undefined,
  center: { lat: 46.2096548794286, lng: 7.40106313190809 },
  //center: { lat: 48.88, lng: 2.34 }, // Paris
  size: undefined,
  zoom:18,
}

const positionReducer = (state = initialPosition, action) => {
  switch (action.type) {
    case 'UPDATE_POSITION': return action.position
    default:                return state
  }
}

const mapReducer = (state = null, action) => {
  switch (action.type) {
    case 'UPDATE_MAP': return action.map
    default:           return state
  }
}

const featuresReducer = (state = {} , action) => {
  switch (action.type) {
    case 'UPDATE_FEATURES':
      return { ...state, [action.feature.properties.id]: action.feature }
    default:                return state
  }
}

const displayMaskReducer = (state = {}, action) => {
  switch (action.type) {
    case 'UPDATE_DISPLAY_MASK': return _.isEmpty(state)
                                 ? action.mask
                                 : turf.union(state, action.mask)
    default:            return state
  }
}

export default combineReducers({
  position: positionReducer,
  map: mapReducer,
  features: featuresReducer,
  displayMask: displayMaskReducer,
})
