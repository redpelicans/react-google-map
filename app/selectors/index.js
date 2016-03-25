import { createSelector } from 'reselect'
import _ from 'lodash'

const getPositionState = state => state.position

export default createSelector(
  getPositionState,
  (position) => {
    return {
      position,
    }
  }
)
