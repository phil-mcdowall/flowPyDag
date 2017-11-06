import React, {PropTypes} from 'react';
import onClickOutside from 'react-onclickoutside';
import NodeInputList from './NodeInputList';
import NodeOuputList from './NodeOutputList';
import TextField from 'material-ui/TextField';
import { Sparklines,SparklinesBars,SparklinesLine,SparklinesReferenceLine } from 'react-sparklines';
var Draggable = require('react-draggable');
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';




class AxisLabels extends React.Component {
    constructor(props) {
        super(props);

    }

    render() {
        if(this.props.data.min) {
            return (
                <div className="axisLimits" style={{
                    width: '100%',
                    color: 'white',
                    fontSize: 'x-small',
                    marginTop: '-10px'
                }}>
                    <div style={{
                        width: '33%',
                        display: 'inline-block'
                    }}>{this.props.data.min ? this.props.data.min.toPrecision(3) : []}</div>
                    <div style={{width: '33%', display: 'inline-block', 'textAlign': 'center'}}>
                        mu:{this.props.data.mean ? this.props.data.mean.toPrecision(3) : []}</div>
                    <div style={{
                        width: '33%',
                        display: 'inline-block',
                        'textAlign': 'right'
                    }}>{this.props.data.max ? this.props.data.max.toPrecision(3) : []}</div>
                </div>
            )
        }
        else{
            return <span/>
        }
    }
}


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

  updateValue(index,data){
      console.log("from 3rd level, pinIdx = " + index)
      this.props.updateValue(this.props.nid,index,data)
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
              <span className="node-title">
{this.props.title} :
                <TextField
      id="text-field-default"
      onFocus={this.disable_keybindings}
      defaultValue={this.props.name}
            style={{width:'35%',height:'100%',color:'white','font-size':'inherit'}}
            underlineStyle={{display: 'none'}}
      inputStyle={{height:'100%',color:'white','font-size':'inherit'}}
    />

                   </span>
            </header>
            <div className="node-content">
              <NodeInputList items={this.props.inputs} onCompleteConnector={(index)=>this.onCompleteConnector(index)} updateValue={this.updateValue.bind(this)}/>
              <NodeOuputList items={this.props.outputs} onStartConnector={(index)=>this.onStartConnector(index)} />

            <Sparklines data={this.props.data ? this.props.data.freq : []} style={{background: "rgb(145, 195, 200)"}} svgHeight={40}>
                <SparklinesLine style={{ stroke: "#2f2828", fill: "none" }} />

            </Sparklines>
                <AxisLabels data={this.props.data}/>

            </div>
        </section>
        </Draggable>
      </div>
    );
	}
}

export default onClickOutside(Node);