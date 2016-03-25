import _ from 'lodash'
import { combineReducers } from 'redux'

const initialPosition = {
  bounds: undefined,
  marginBounds: undefined,
  center: { lat: 46.2096548794286, lng: 7.40106313190809 },
  //center: { lat: 48.88, lng: 2.34 }, // Paris
  size: undefined,
  zoom: 12,
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

const featuresReducer = (state = [], action) => {
  switch (action.type) {
    case 'UPDATE_FEATURES': return (state.length) ? _.union(action.features, state) : action.features
    default:                return state
  }
}

export default combineReducers({
  position: positionReducer,
  map: mapReducer,
  features: featuresReducer,
})
