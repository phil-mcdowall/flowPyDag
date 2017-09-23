import React from 'react';


var node_templates = {normal:{type:'Normal',fields:{
    in:[{'name':'mu'},{'name':'sd'}],
    out:[{'name':'return'}]
}}}

export default class NodeAddList extends React.Component {
render() {
    return (
        <div className="card">
        <div className="list-group list-group-flush">
            <a href="#" className="list-group-item active">
                Distributions
            </a>
            <a href="#" className="list-group-item list-group-item-action" onClick={this.props.add_node}>Normal</a>
            <a href="#" className="list-group-item list-group-item-action" onClick={this.props.add_node}>Uniform</a>
            <a href="#" className="list-group-item list-group-item-action" onClick={this.props.build_code}>Build!</a>
        </div>
        </div>

    )
}
    }
