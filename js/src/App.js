import React, { Component } from 'react';
import ReactNodeGraph from './graph/'
import toposort from 'toposort'
import NodeAddList from './nodeAddList'
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/styles';
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
            in:[{'name':'mu','value':'None'},
                {'name':'sd','value':'None'},
                {'name':'observed','value':'None'}],
            out:[{'name':'return'}]
        }
}

const LiteralNode = function(nid,type,fields){
    this.nid = nid;
    this.type = type;
    this.x = 200;
    this.y = 200;
    this.n_connects = 0;
    this.level = 0;
    this.input_weights = [0];
    this.name = "var" + nid;
    this.fields = fields ? fields : {
        in:[],
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
        init_state.graph.nodes[1] = new FunctionNode(1,'normal');
        this.state = init_state;
        this.node_count = 2
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




    onNewConnector(fromNode,fromPin,toNode,toPin) {
        let graph = this.state.graph;
        let connections = [...graph.connections, {
            from_node : fromNode,
            from : fromPin,
            to_node : toNode,
            to : toPin
        }];
        let toPinIdx = this.computePinIndexfromLabel(graph.nodes[toNode].fields.in,toPin)
        graph.nodes[toNode].fields.in[toPinIdx].value = graph.nodes[fromNode].name;
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

    createNewNode(){
        let graph = this.state.graph;
        graph.nodes[this.node_count] = new FunctionNode(this.node_count,'Normal')
        this.node_count += 1;
        this.setState({'graph':graph})
    }
    render() {
           return (
               <div className="container-fluid">
                   <div className="row">
                   <div id="OUTPUT" className="col-3">
                       <NodeAddList node_types = {node_types} add_node={this.createNewNode.bind(this)} build_code={this.generateCode.bind(this)} />
                       <SyntaxHighlighter language='python' style={docco}>{this.state.code}</SyntaxHighlighter>
                   </div>
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
               </div>
        )
    }
}