import React, { Component } from 'react';
import ReactNodeGraph from './graph/'
import MenuBar from './new_node'
import {NotificationContainer, NotificationManager} from 'react-notifications';
import toposort from 'toposort'

const FunctionNode = function(nid,params={callable,fields,module,x,y}){
        //unique id for node
        this.nid = nid;

        //related python callable
        this.type = params.callable ? params.callable : '';
        this.module = params.module ? params.module :'pymc3';

        //position on graph
        this.x = params.x ? params.x :200;
        this.y = params.y ? params.y : 200;

        //default name, expected to be changed
        this.name = "var" + nid;

        this.fields = params.fields ? params.fields : {
            input:[{'name':'mu','value':'None'},
                {'name':'sd','value':'None'},
                {'name':'observed','value':'None'}],
            out:[{'name':'return'}]
        }

        this.data = []
    this.color = params.color ? params.color : 'black'
};

const node_mapping = {
    'normal': function () {
        this.callable = 'Normal';
        this.fields = {input:[{'name': 'mu', 'value': 'None'}, {'name': 'sd', 'value': 'None'}, {
            'name': 'observed',
            'value': 'None'
        }],
        out:[{'name': 'return'}]}
    },
    'binomial': function () {
        this.callable = 'Binomial';
        this.fields = {input:[{'name': 'n', 'value': 'None'}, {'name': 'p', 'value': 'None'}, {
            'name': 'observed',
            'value': 'None'
        }],
        out:[{'name': 'return'}]}
    },
    'uniform': function () {
        this.callable = 'Uniform';
        this.fields = {input:[{'name': 'lower', 'value': 'None'}, {'name': 'upper', 'value': 'None'}, {
            'name': 'observed',
            'value': 'None'
        }],
        out:[{'name': 'return'}]}
    },
    'gamma': function () {
        this.callable = 'Uniform';
        this.input = [{'name': 'alpha', 'value': 'None'}, {'name': 'beta', 'value': 'None'}, {
            'name': 'observed',
            'value': 'None'
        }];
        this.out = [{'name': 'return'}]
    },
    'product': function () {
        this.callable = 'math.dot';
        this.fields = {input:[{'name': 'a', 'value': 'None'}, {'name': 'b', 'value': 'None'}],
        out:[{'name': 'return'}]};
        this.color = "rgb(94, 159, 173)"
    },
    'sum': function () {
        this.callable = 'math.sum';
        this.fields = {input:[{'name': 'a', 'value': 'None'}, {'name': 'b', 'value': 'None'}],
        out:[{'name': 'return'}]};
        this.color = "rgb(94, 159, 173)"
    },
}


const LiteralNode = function(nid,fields,x,y){
    //Literal nodes have no inputs and must be defined at initialisation
    //unique id for node
    this.nid = nid;
    this.type = "Data"
    //position on graph
    this.x = x ? x :200;
    this.y = y ? y : 200;
    //literal nodes do not have editable names
    this.name = this.nid;
    this.fields = fields ? fields : {
        input:[{'name':'literal','value':'None'}],
        out:[{'name':'value'}]
    }
    this.color = "#032b33"
};

export default class App extends Component {

    constructor(props) {
        super(props);
        let init_state = {
            graph:{nodes:{},connections:[]},
        };

        this.node_count = 1;

        // add nodes for constants from props
        props.props.literals.forEach(function(elem){init_state.graph.nodes[elem] = new LiteralNode(elem);this.node_count+=1}.bind(this))
        this.state = init_state;

        // comm allowing communication with jupyter kernel
        // send message with this.comm.send()
        this.comm = props.props.comm;
        // callback function used when message recieved from kernel
        this.comm._msg_callback = this.msg_handler.bind(this);
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

    // return graph connections as an array of edges [...,[from,to]]
    connectionsAsArray(){
        return this.state.graph.connections.map(function(e){return [e.from_node,e.to_node]})
    }

    kernelGenerateCode(){
        // get topological order of nodes, and send {graph,order} to kernel for processing
        try {
            let order = toposort(this.connectionsAsArray());
            this.comm.send({type:'CodeCompile',body:{graph:this.state.graph,'order':order}})
            this.createNotification('graph compiling...')        }
        catch(err) {
            console.log("cycles found")
        }
        }

    updateNodeData(node,data){
        let graph = this.state.graph;
        graph.nodes[node].data = data;
        this.setState({graph: graph});
    }
    storeConnection(connection){
        console.log(connection)
        let fromNode = connection.from_node;
        let fromPin = connection.from;
        let toNode = connection.to_node;
        let toPin = connection.to;

        let graph = this.state.graph;

        let connections = [...graph.connections,connection];
        let toPinIdx = this.computePinIndexfromLabel(graph.nodes[toNode].fields.input,toPin)
        graph.nodes[toNode].fields.input[toPinIdx].value = graph.nodes[fromNode].name;
        console.log(graph)
        graph.connections = connections;
        this.setState({graph: graph});
    }

    registerConnection(connection){
        this.comm.send({type:'NewConnection',body:connection})
    }

    onNewConnector(fromNode,fromPin,toNode,toPin) {

        let connection = {from_node : fromNode,
                        from : fromPin,
                        to_node : toNode,
                        to : toPin};

        this.storeConnection(connection);
        this.registerConnection(connection);

    }

    deregisterConnection(connection){
        this.comm.send({type:'DelConnection',body:connection})
    }

    onRemoveConnector(connector) {
        let graph = this.state.graph;
        let connections = [...graph.connections];
        connections = connections.filter((connection) => {
            return connection != connector
        });
        graph.connections = connections;
        this.setState({graph: graph});
        this.deregisterConnection(connector)
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

    updateNodes(posteriors){
        this.createNotification('updating posteriors...')
        for(var node_name in posteriors){
            this.updateNodeData(node_name,posteriors[node_name])
        }
    }

    // Handle messages from the kernel
    msg_handler(message){
        console.log(message)
        let msg = message.content.data;
        if(msg.type == "ERROR"){this.createNotification(msg.body)}
        if(msg.type == "POSTERIOR"){this.updateNodes(msg.body)}
    }


    registerNewNode(node){
        this.comm.send({type:'NewNode',body:node})
    }

    createNewNode(event,node_type){
        console.log(node_mapping[node_type])
        let node = new FunctionNode(this.node_count,new node_mapping[node_type])
        let graph = this.state.graph;
        graph.nodes[this.node_count] = node;
        this.node_count += 1;

        this.setState({'graph':graph});
        this.registerNewNode(node)
    }

    kernelSample(){
        this.comm.send({type:'Sample',body:{graph:this.state.graph}})
    }

    createNotification(msg){
          NotificationManager.info(msg);


    };

    render() {
           return (
               <div>
                   <MenuBar new_node={this.createNewNode.bind(this)} generate = {this.kernelGenerateCode.bind(this)} sample={this.kernelSample.bind(this)}/>
            <ReactNodeGraph
                data={this.state.graph}
                onNodeMove={(nid, pos)=>this.onNodeMove(nid, pos)}
                onNodeStartMove={(nid)=>this.onNodeStartMove(nid)}
                onNewConnector={(n1,o,n2,i)=>this.onNewConnector(n1,o,n2,i)}
                onRemoveConnector={(connector)=>this.onRemoveConnector(connector)}
                onNodeSelect={(nid) => {this.handleNodeSelect(nid)}}
                onNodeDeselect={(nid) => {this.handleNodeDeselect(nid)}}
            />
<NotificationContainer/>
               </div>
        )
    }
}