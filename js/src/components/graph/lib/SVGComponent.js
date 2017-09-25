import React, { Component } from 'react';

export default class SVGComponent extends Component {
  render() {
    return <svg style={{zIndex:9000}} {...this.props} id="graphSVG" ref="svg">{this.props.children}</svg>;
  }
}