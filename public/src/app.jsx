import React from 'react';
import ReactDOM from 'react-dom';
import HomePage from './containers/HomePage';

const Root = () => (
  <HomePage />
);

ReactDOM.render(
  <Root />,
  document.getElementById('app')
);
