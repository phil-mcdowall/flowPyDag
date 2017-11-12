from jupyter_react import Component
import random
import numpy as np
from collections import OrderedDict
import json
from .node_generator import PyMC3Nodes
from .floNodes import TheanoOpNode, DistributionNode, DataNode, NullNode, Node

class Dag(Component):
    module = 'Dag'

    def __init__(self,data=None, **kwargs):
        self.code_generator = CodeGenerator()
        self.code_generator.context_manager = PyMC3ContextManager()
        self.code_generator.postfix = PyMC3QuickInference()

        # Code is executed in evalscope dictionary
        self.evalscope = {}
        self._evalscope_imports(['pymc3','theano'])

        self.code = None

        self.graph = None
        self.graph_nodes = None
        self.nodes = {}

        props = {'node_types': PyMC3Nodes}

        self.node_mapping = {'expression': TheanoOpNode,
                             'distribution': DistributionNode,
                             'function': Node,
                             'data': DataNode}

        if data is not None:
            if type(data) is not dict:
                raise ValueError("Data must be a dictionary")
            self.evalscope.update(data)
            props.update({'literals':[str(key) for key in data.keys()]})

        super(Dag, self).__init__(target_name='react.dag', props=props, **kwargs)

        self.on_msg(self._handle_msg)

    def _evalscope_imports(self,modules):
        import_statement = ";".join(["import {}".format(module) for module in modules])
        exec(import_statement, self.evalscope)

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

    def send_load_graph_message(self,graph):
        msg_type = "LOAD_GRAPH"
        self.send({'type': msg_type, 'body': graph})

    def _get_posteriors(self):

        msg_body = {}

        for node in self.nodes:
            print(node)
            if isinstance(node,DistributionNode):
                node_id, node_name, node_type = node.node.get('nid'), node.sample_name, node.node.get('type')
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
    """
    Creates a string representation of a graph of executable nodes
    """
    def __init__(self):
        self.graph = None
        self.nodes = None
        self.context_manager = ''
        self.postfix = ''

    def generate_code(self,nodes):
        indent_level = 0
        context_manager = str(self.context_manager)
        if context_manager is not '':
            indent_level = 1
        postfix = str(self.postfix)
        try:
            code = "\n{}".format(" "*4*indent_level).join(str(node) for node in nodes)
        except ValueError:
            raise
        return context_manager + code + postfix

class PyMC3ContextManager:
    # TODO context manager as node
    def __str__(self):
        context_manager = "with pymc3.Model() as model:\n"
        return context_manager

class PyMC3QuickInference:
    # TODO inference as node
    def __str__(self):
        n_samples = 1000
        inference = "\n    approx = pymc3.fit(n=30000, method=pymc3.ADVI(), model=model)" \
                    "\n    samples = approx.sample({nsamples})".format(nsamples=n_samples)
        return inference