import { combineReducers } from 'redux'

//const undefinedLatLng = { lat: undefined, lng: undefined }
//const initialBounds = { nw: undefinedLatLng, se: undefinedLatLng }

const initialPosition = {
  bounds: undefined,
  marginBounds: undefined,
  center: { lat: 46.2096548794286, lng: 7.40106313190809 },
  size: undefined,
  zoom: 22,
}

const positionReducer = (state = initialPosition, action) => {
  switch (action.type) {
    case 'UPDATE_POSITION': return action.position
    default:                return state
  }
}

export default combineReducers({
  position: positionReducer,
})
