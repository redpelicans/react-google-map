import _ from 'lodash'

const UPDATE_POSITION = 'UPDATE_POSITION'
const UPDATE_MAP = 'UPDATE_MAP'
const UPDATE_FEATURES = 'UPDATE_FEATURES'
const UPDATE_DISPLAY_MASK = 'UPDATE_DISPLAY_MASK'

export const updatePosition = position => {
  return { type: UPDATE_POSITION, position }
}

export const updateMap = map => {
  return { type: UPDATE_MAP, map }
}

export const updateFeatures = (features, feature, map) => {
  if (!features[feature.properties.id]) {
    map.data.addGeoJson(feature)
    return { type: UPDATE_FEATURES, feature }
  }
  return { type: 'FEATURE_ALREADY_ADDED' }
}

export const updateDisplayMask = (newMask) => {
  return { type: UPDATE_DISPLAY_MASK, mask: newMask }
}
