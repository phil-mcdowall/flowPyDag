import JupyterReact from 'jupyter-react-js';
import components from './components';

function load_ipython_extension () {
  requirejs([
    "base/js/namespace",
    "base/js/events",
  ], function( Jupyter, events ) {
    JupyterReact.init( Jupyter, events, 'react.dag', { components, save: false } );
    console.log(components)
  });
}

module.exports = {
  load_ipython_extension: load_ipython_extension
};
