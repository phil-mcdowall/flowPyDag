import React from 'react';

import NodeInputListItem from './NodeInputListItem';



export default class NodeInputList extends React.Component {

                onMouseUp(i){
                this.props.onCompleteConnector(i);
            }

            	updateValue(index,data){
                    alert("!")
                	console.log(index,data)
                	this.props.updateValue(index,data);
				}

                render() {
                let i = 0;
                return (
                <div className="nodeInputWrapper">
                <ul className="nodeInputList">
                {this.props.items.map((item) => {
                    return (
						<NodeInputListItem updateValue={this.updateValue.bind(this)} onMouseUp={(i)=>this.onMouseUp(i)} key={i} index={i++} item={item} onUpdateValue={this.updateValue.bind(this)}/>
                    )
                })}
                </ul>
                </div>
                );
            }
            }

