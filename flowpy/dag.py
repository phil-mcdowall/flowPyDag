from jupyter_react import Component
import random
import numpy as np
from collections import OrderedDict
import json
from .node_generator import node_types_json, ExpressionNode, DistributionNode, Node

class Dag(Component):
    module = 'Dag'

    def __init__(self,data=None, **kwargs):
        self.code_generator = CodeGenerator()

        # Code is executed in evalscope dictionary
        self.evalscope = {}
        exec("import pymc3;import theano", self.evalscope)

        self.code = None

        self.graph = None
        self.graph_nodes = None

        props = {'node_types': node_types_json}

        if data is not None:
            if type(data) is not dict:
                raise ValueError("Data must be a dictionary")
            self.evalscope.update(data)
            props.update({'literals':[str(key) for key in data.keys()]})

        super(Dag, self).__init__(target_name='react.dag', props=props, **kwargs)

        self.on_msg(self._handle_msg)
        self.nodes = {}

        self.node_mapping = {'expression': ExpressionNode,
                             'distribution': DistributionNode,
                             'function': Node,
                             'data': DataNode}

    def parse_graph_message(self, graph):
        self.graph = graph['graph']
        self.graph_nodes =[graph['graph']['nodes'][str(node_id)] for node_id in graph['order']]
        for node in self.graph_nodes:
            print('node: {}'.format(node))
        self.nodes = [self.node_mapping.get(node['type'], NullNode)(node=node) for node in self.graph_nodes]

    def compile_graph(self):
        self.code = self.code_generator.generate_code(self.nodes)

    def evaluate(self):
        try:
            exec(self.code, self.evalscope)
        except Exception as e:
            self.send_error_message(e)
            raise

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
            self.update_posteriors_message(posteriors)
        else:
            self.send_error_message("unknown message received from notebook: {}".format(msg))

    def update_posteriors_message(self, posteriors):
        msg_type = "POSTERIOR"
        self.send({'type': msg_type, 'body': posteriors})

    def send_error_message(self, error):
        msg_type = "ERROR"
        self.send({'type': msg_type, 'body': str(error)})

    def _get_posteriors(self):

        msg_body = {}

        for node in self.nodes:
            node_id, node_name, node_type = node.node.get('nid'), node.name, node.node.get('type')
            print("id:{} name:{}".format(node_id,node_name))
            if node_type == 'distribution':
                try:
                    samples = self.evalscope['samples'][node_name]
                    histogram = np.histogram(samples, bins=30)
                    msg_body[node_id] = {'freq':list(histogram[0]),
                                         'min':np.min(histogram[1]),
                                         'max':np.max(histogram[1]),
                                         'mean':np.mean(samples),
                                         'median':np.median(samples)}
                except KeyError as e:
                    print(e)
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
        except ValueError:
            raise
        return context_manager + code + inference


# class Node:
#     def __init__(self,node):
#         print(node)
#         self.node = node
#         self.args = self.dict_args()
#         self.set_name(node)
#         self.args_str = self.str_args()
#         self.check_args_for_required()
#         self.return_template = "    {name} = {callable}('{name}',{args})\n"
#
#     def set_name(self,node):
#         self.name = node['nid']
#
#     def check_args_for_required(self):
#         for arg in self.node['fields']['input']:
#             if arg['value'] == '__required__':
#                 raise ValueError("Required argument {} missing in node {}".format(arg['name'],self.node['name']))
#
#     def dict_args(self):
#         args = {}
#         for arg in self.node['fields']['input']:
#             args[arg['name']] = arg['value']
#         return args
#
#     def str_args(self):
#         return ','.join(["{name} = {value}".format(**x) for x in self.node['fields']['input'] if x['value'] != ''])
#
#     def __str__(self):
#         return self.return_template.format(args=self.args_str, **self.node)


# class ExpressionNode(Node):
#     def __init__(self,node):
#         super(ExpressionNode,self).__init__(node)
#         self.return_template = "    {name} = {module}.{callable}({args})\n"
#
#     def str_args(self):
#         return ','.join(["{value}".format(**x) for x in self.node['fields']['input'] if x['value'] != ''])
#
#
# class DistributionNode(Node):
#     def __init__(self, node):
#         super(DistributionNode, self).__init__(node)
#         self.return_template = "    {name} = pymc3.{callable}({args})\n"
#
#     def set_name(self,node):
#         self.name = self.args['name'].strip("'")

class DataNode:
    def __init__(self,*kwargs):
        pass
    def __str__(self):
        return ''

class NullNode:
    def __init__(self,**kwargs):
        pass
    def __str__(self):
        return ''