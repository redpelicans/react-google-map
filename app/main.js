// Styles
import './css/base.css'

// React
import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

// App
import App from './containers/app'

// Store
import configureStore from './store'
const store = configureStore()

render (
  <Provider store={store}>
    <App />
  </Provider>
, document.getElementById('appContent')
)
