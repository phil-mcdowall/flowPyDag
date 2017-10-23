import React, {PropTypes} from 'react';
import onClickOutside from 'react-onclickoutside';
import NodeInputList from './NodeInputList';
import NodeOuputList from './NodeOutputList';
import TextField from 'material-ui/TextField';
import { Sparklines,SparklinesBars,SparklinesLine,SparklinesReferenceLine } from 'react-sparklines';
var Draggable = require('react-draggable');
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';


const muiTheme = getMuiTheme({

});

class Node extends React.Component {
  constructor(props) {
    super(props);
    // this.state = {
    //   selected: false
    // }
  }

  handleDragStart(event, ui) {
    this.props.onNodeStart(this.props.nid, ui);
  }

  handleDragStop(event, ui) {
    this.props.onNodeStop(this.props.nid, ui.position);
  }

  handleDrag(event, ui) {
    this.props.onNodeMove(this.props.nid, ui.position);
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   return this.state.selected !== nextState.selected;
  // }

  onStartConnector(index) {
    this.props.onStartConnector(this.props.nid, index);
  }

  onCompleteConnector(index) {
    this.props.onCompleteConnector(this.props.nid, index);
  }

  onChangeName(nid){

  }

  handleClick(e) {
    // this.setState({selected: true});
    if (this.props.onNodeSelect) {
      this.props.onNodeSelect(this.props.nid);
    }
  }

  handleClickOutside() {
    // let {selected} = this.state;
    if (this.props.onNodeDeselect && selected) {
      this.props.onNodeDeselect(this.props.nid);
    }
    // this.setState({selected: false});
  }

  disable_keybindings(){
    Jupyter.keyboard_manager.disable()
  }

	render() {
    // let {selected} = this.state;

    let nodeClass = 'node' //+ (selected ? ' selected' : '');

		return (
		  <div onDoubleClick={(e) => {this.handleClick(e)}}>
        <Draggable
          start={{x:this.props.pos.x,y:this.props.pos.y}}
          handle=".node-header"
         onStart={(event, ui)=>this.handleDragStart(event, ui)}
       onStop={(event, ui)=>this.handleDragStop(event, ui)}
     onDrag={(event, ui)=>this.handleDrag(event, ui)}
        >
        <section className={nodeClass} style={{zIndex:10000}}>
            <header className="node-header" style={{backgroundColor:this.props.color}}>
              <MuiThemeProvider muiTheme={muiTheme}>
              <span className="node-title">
{this.props.title} :
                <TextField
      id="text-field-default"
      onFocus={this.disable_keybindings}
      defaultValue={this.props.name}
            style={{width:'50%',height:'100%',color:'white','font-size':'inherit'}}
            underlineStyle={{display: 'none'}}
      inputStyle={{height:'100%',color:'white','font-size':'inherit'}}
    />

                   </span>
              </MuiThemeProvider>
            </header>
            <div className="node-content">
              <NodeInputList items={this.props.inputs} onCompleteConnector={(index)=>this.onCompleteConnector(index)} />

              {/*<Sparklines data={this.props.data} svgHeight={20}>*/}
                  {/*<SparklinesBars style={{ stroke: "white", fill: "#41c3f9", fillOpacity: ".25" }} />*/}
              {/*</Sparklines>*/}
<Sparklines data={this.props.data} style={{background: "rgb(145, 195, 200)"}} svgHeight={40}>
    <SparklinesLine style={{ stroke: "#2f2828", fill: "none" }} />
    <SparklinesReferenceLine
        style={{ stroke: '#2f2828', strokeOpacity: .75, strokeDasharray: '2, 2' }} />
</Sparklines>
              <NodeOuputList items={this.props.outputs} onStartConnector={(index)=>this.onStartConnector(index)} />
            </div>
        </section>
        </Draggable>
      </div>
    );
	}
}

export default onClickOutside(Node);