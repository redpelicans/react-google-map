const UPDATE_POSITION = 'UPDATE_POSITION'
const UPDATE_MAP = 'UPDATE_MAP'

export const updatePosition = position => {
  return { type: UPDATE_POSITION, position }
}

export const updateMap = map => {
  return { type: UPDATE_MAP, map }
}
