from jupyter_react import Component
import random
import numpy as np
from collections import OrderedDict
import json


class Dag(Component):
    module = 'Dag'

    def __init__(self,data=None, **kwargs):
        self.code_generator = CodeGenerator()

        # Code is executed in evalscope dictionary
        self.evalscope = {}
        exec("import pymc3", self.evalscope)

        self.code = None

        self.graph = None
        self.graph_nodes = None

        if data is not None:
            if type(data) is not dict:
                raise ValueError("Data must be a dictionary")
            self.evalscope.update(data)
            props = {'literals':[str(key) for key in data.keys()]}
        else:
            props = {}

        super(Dag, self).__init__(target_name='react.dag',props=props, **kwargs)

        self.on_msg(self._handle_msg)
        self.nodes = {}

        self.node_mapping = {'expression': ExpressionNode,
                             'distribution': DistributionNode,
                             'function': Node,
                             'data': DataNode}

    def parse_graph_message(self, graph):
        self.graph = graph['graph']
        self.graph_nodes =[graph['graph']['nodes'][str(node_id)] for node_id in graph['order']]
        self.nodes = [self.node_mapping.get(node['type'],NullNode)(node) for node in self.graph_nodes]

    def compile_graph(self):
        self.code = self.code_generator.generate_code(self.nodes)

    def evaluate(self):
        try:
            exec(self.code, self.evalscope)
        except Exception as e:
            self.send_error_message(e)

    def _handle_msg(self, msg):

        message = msg['content']['data']

        if message['type'] == 'CodeCompile':
            """
            run approximate advi then short samples to update node distributions
            """
            self.parse_graph_message(message['body'])
            self.compile_graph()
            self.evaluate()
            posteriors = self._get_posteriors()
            self.update_posteriors_msg(posteriors)
        else:
            self.send_error_message("unknown message received from notebook: {}".format(msg))

    def update_posteriors_msg(self,posteriors):
        msg_type = "POSTERIOR"
        self.send({'type': msg_type, 'body': posteriors})

    def send_error_message(self, error):
        msg_type = "ERROR"
        self.send({'type': msg_type, 'body': str(error)})

    def _get_posteriors(self):
        msg_body = {}

        for node in self.nodes:
            node_id, node_name = node.node.get('nid'), node.node.get('name')
            try:
                samples = self.evalscope['samples'][node_name]
                histogram = np.histogram(samples)
                msg_body[node_id] = {'freq':list(histogram[0]),
                                     'min':np.min(histogram[1]),
                                     'max':np.max(histogram[1]),
                                     'mean':np.mean(samples),
                                     'median':np.median(samples)}
            except KeyError:
                pass
        return msg_body

    def send_load_graph_message(self,graph):
        msg_type = "LOAD_GRAPH"
        self.send({'type': msg_type, 'body': graph})

    def save_graph(self,path):
        if self.graph:
            with open(path, 'w') as outfile:
                json.dump(self.graph, outfile)
        else:
            raise ValueError("Compiled graph not found")

    def load_graph(self,path):
        with open(path, 'r') as infile:
            graph = json.load(infile)
        self.send_load_graph_message(graph)

    def __str__(self):
        return self.code


class CodeGenerator:
    def __init__(self):
        self.graph = None
        self.nodes = None

    def generate_code(self,nodes):
        n_samples = 1000
        context_manager = "with pymc3.Model() as model:\n"
        inference = "\n    approx = pymc3.fit(n=30000, method=pymc3.ADVI(), model=model)" \
                    "\n    samples = approx.sample({nsamples})".format(nsamples=n_samples)
        try:
            code = "".join(str(node) for node in nodes)
        except:
            raise ValueError(nodes)
        return context_manager + code + inference


class Node:
    def __init__(self,node):
        self.node = node
        self.args = self.str_args(node)
        self.return_template = "    {name} = {callable}('{name}',{args})\n"

    def str_args(self,node):
        return ','.join(["{name} = {value}".format(**x) for x in node['fields']['input'] if x['value'] != 'None'])

    def __str__(self):
        return self.return_template.format(args=self.args, **self.node)


class ExpressionNode(Node):
    def __init__(self,node):
        super(ExpressionNode,self).__init__(node)
        self.return_template = "    {name} = {args} \n"

    def str_args(self,node):
        return node['callable'].join(["{value}".format(**x) for x in node['fields']['input'] if x['value'] != 'None'])


class DistributionNode(Node):
    def __init__(self, node):
        super(DistributionNode, self).__init__(node)
        self.return_template = "    {name} = pymc3.{callable}('{name}',{args})\n"

class DataNode(Node):
    def __str__(self):
        return ''

class NullNode(Node):
    def __str__(self):
        return ''