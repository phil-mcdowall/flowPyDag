import React from 'react';
import TextField from 'material-ui/TextField';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Tooltip from 'material-ui/internal/Tooltip';

class ShortenWTooltip extends React.Component {
    constructor(props) {
        super(props);
        this.content = props.content;
    }
    render(){
		if(this.content.length >= 7){return 								<MuiThemeProvider muiTheme={muiTheme}>
				<span>{this.content.slice(0,5) + '..'}			</span>
		</MuiThemeProvider>
		}
    	else{return <span>{this.content}</span>}
	}
}



class ValueInput extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hover: false,
		}
	}
	  disable_keybindings(){
    Jupyter.keyboard_manager.disable()
  }

	render(){
	if(!this.props.props.item.connected){
		return(
								<MuiThemeProvider muiTheme={muiTheme}>
									<span>
										{' =  '}
					<TextField
      id="text-field-default"
      onFocus={this.disable_keybindings}
	  hintText={'...'}
						onChange={this.props.updateValue}
						hintStyle={{color:'lightgrey',bottom:'0px'}}
            style={{width:'20%',height:'100%',color:'white','font-size':'inherit'}}
            underlineStyle={{display: 'none'}}
      inputStyle={{height:'100%',color:'white','font-size':'inherit'}}
					/></span>
					</MuiThemeProvider>
		)
	}
	else{
		return <span/>
	}
	}
}

const muiTheme = getMuiTheme({

});
export default class NodeInputListItem extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hover: false
		}
	}


	onMouseUp(e) {
		e.stopPropagation();
  		e.preventDefault();

		this.props.onMouseUp(this.props.index);
	}

  onMouseOver() {
		this.setState({hover: true});
	}

	onMouseOut() {
    this.setState({hover: false});
  }

	noop(e) {
		e.stopPropagation();
  		e.preventDefault();
	}

	UpdateValue(e,data){
	this.props.updateValue(this.props.index,data)
}

	render() {
		let {name} = this.props.item;
		let {hover} = this.state;
		let is_required = this.props.item.required ? 'required ' : '';
		let is_connected = this.props.item.connected ? 'connected ' : '';
		let has_value = (this.props.item.connected) | this.props.item.value != '' ? 'hasvalue ' : '';
		let is_hovered = hover ? 'fa fa-circle-o hover' : 'fa fa-circle-o'
		let full_class = is_required + has_value + is_hovered
		return (
			<li>
				<a onClick={(e)=>this.noop(e)} onMouseUp={(e)=>this.onMouseUp(e)} href="#">
					<i className={full_class}
						 onMouseOver={() => {this.onMouseOver()}}
						 onMouseOut={() => {this.onMouseOut()}}
					></i>
					<ShortenWTooltip content={name}/>
					<ValueInput props={this.props} updateValue={(e,data)=>this.UpdateValue(e,data)}/>
				</a>
			</li>
		);			
	}
}
