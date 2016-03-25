import _ from 'lodash'

const UPDATE_POSITION = 'UPDATE_POSITION'
const UPDATE_MAP = 'UPDATE_MAP'
const UPDATE_FEATURES = 'UPDATE_FEATURES'

export const updatePosition = position => {
  return { type: UPDATE_POSITION, position }
}

export const updateMap = map => {
  return { type: UPDATE_MAP, map }
}

export const updateFeatures = (currentFeatures, collection, map) => {
  const diff = _.differenceBy(collection.features, currentFeatures, 'properties.id')
  map.data.addGeoJson({...collection, features: diff})
  console.log(diff)
  return { type: UPDATE_FEATURES, features: diff }
}
