import React, { Component } from 'react';
import ReactNodeGraph from './graph/'
import DropdownTest from './new_node'

import toposort from 'toposort'
// import NodeAddList from './nodeAddList'
// import { docco } from 'react-syntax-highlighter/dist/styles';
const FunctionNode = function(nid,type,fields){
        this.nid = nid;
        this.type = type;
        this.x = 200;
        this.y = 200;
        this.n_connects = 0;
        this.level = 0;
        this.input_weights = [0];
        this.name = "var" + nid;
        this.fields = fields ? fields : {
            input:[{'name':'mu','value':'None'},
                {'name':'sd','value':'None'},
                {'name':'observed','value':'None'}],
            out:[{'name':'return'}]
        }
}

const LiteralNode = function(nid,fields){
    this.nid = nid;
    this.type = "_literal"
    this.x = 200;
    this.y = 200;
    this.n_connects = 0;
    this.level = 0;
    this.input_weights = [0];
    this.name = this.nid;
    this.fields = fields ? fields : {
        input:[{'name':'literal','value':'None'}],
        out:[{'name':'value'}]
    }
}


export default class App extends Component {

    constructor(props) {
        super(props);
        let init_state = {
            graph:{nodes:{},connections:[]},
            code : 'code output'
        };
        console.log(props)
        init_state.graph.nodes[1] = new FunctionNode(1,'pymc3.Normal')
        this.node_count = 2;
        this.literals = props.props.literals
        this.literals.forEach(function(elem){init_state.graph.nodes[elem] = new LiteralNode(elem);this.node_count+=1}.bind(this))
        this.state = init_state;
        this.comm = props.props.comm
        this.comm._msg_callback = this.msg_handler
        window.com_handle  = props.props.comm
    }

    consArray(){
        return this.state.graph.connections.map(function(e){return [e.from_node,e.to_node]})
    }

    computePinIndexfromLabel(pins, pinLabel) {
        let reval = 0;

        for (let pin of pins) {
            if (pin.name === pinLabel) {
                return reval;
            } else {
                reval++;
            }

        }
    }

    generateArgs(node){
        return node.fields.input.map(function(e){return e.name+"="+e.value}) + ")"
    }
    generateCall(node){
        return node.name +" = " +  node.type + "('" + node.name + "'," + this.generateArgs(node)
    }

    generateCode(){
        try {
            let order = this.consArray();
            order = toposort(order);
            this.comm.send({type:'code_compile',body:{graph:this.state.graph,'order':order}})
        }
        catch(err) {
            console.log("cycles found")
        }
        }





    onNewConnector(fromNode,fromPin,toNode,toPin) {
        let graph = this.state.graph;
        let connections = [...graph.connections, {
            from_node : fromNode,
            from : fromPin,
            to_node : toNode,
            to : toPin
        }];
        let toPinIdx = this.computePinIndexfromLabel(graph.nodes[toNode].fields.input,toPin)
        graph.nodes[toNode].fields.input[toPinIdx].value = graph.nodes[fromNode].name;
        graph.connections = connections;
        this.setState({graph: graph});
    }

    onRemoveConnector(connector) {
        let graph = this.state.graph;
        let connections = [...graph.connections]
        connections = connections.filter((connection) => {
            return connection != connector
        })
        graph.connections = connections;
        graph.nodes[this.getNodeIdxById(connector.to_node)].level -= 1
        this.setState({graph: graph});
    }

    onNodeMove(nid, pos) {
        console.log('end move : ' + nid, pos)
    }

    onNodeStartMove(nid) {
        console.log('start move : ' + nid)
    }

    handleNodeSelect(nid) {
        console.log('node selected : ' + nid)
    }

    handleNodeDeselect(nid) {
        console.log('node deselected : ' + nid)
    }

    msg_handler(msg){
        let content = msg.content
        let data = content.data
        let cell=Jupyter.notebook.insert_cell_at_bottom()
        cell.set_text(data)
    }


    registerNewNode(node){
        console.log('registering a node')
        let graph = this.state.graph;
        graph.nodes[this.node_count] = node
        this.node_count += 1;
        this.setState({'graph':graph})
        this.comm.send({type:'test',body:this.node_count})
    }

    createNewNode(event,node_type){
        let node = new FunctionNode(this.node_count,node_type)
        this.registerNewNode(node)
    }

    render() {
           return (
               <div>
                   <DropdownTest new_node={this.createNewNode.bind(this)} generate = {this.generateCode.bind(this)}/>
            <ReactNodeGraph
                data={this.state.graph}
                onNodeMove={(nid, pos)=>this.onNodeMove(nid, pos)}
                onNodeStartMove={(nid)=>this.onNodeStartMove(nid)}
                onNewConnector={(n1,o,n2,i)=>this.onNewConnector(n1,o,n2,i)}
                onRemoveConnector={(connector)=>this.onRemoveConnector(connector)}
                onNodeSelect={(nid) => {this.handleNodeSelect(nid)}}
                onNodeDeselect={(nid) => {this.handleNodeDeselect(nid)}}
            />

               </div>
        )
    }
}