import React from 'react';
import TextField from 'material-ui/TextField';
import Tooltip from 'material-ui/Tooltip';
import Input from 'material-ui/Input';
class ShortenWTooltip extends React.Component {
    constructor(props) {
        super(props);
        this.content = props.content;
    }
    render(){
		if(this.content.length >= 7){return(
				<Tooltip title={this.content}><span>{this.content.slice(0,5) + '..'}			</span></Tooltip>
		)
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
									<span>
										{' =  '}
					<Input
        placeholder="..."
        inputProps={{
          'aria-label': 'Description',
        }}
		style={{color:'white',width:'30%'}}
      onFocus={this.disable_keybindings}
						onChange={this.props.updateValue}

					/></span>
		)
	}
	else{
		return <span/>
	}
	}
}


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

	UpdateValue(e){
	this.props.updateValue(this.props.index,e.target.value)
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
