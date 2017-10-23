from jupyter_react import Component
import random
import numpy as np
from collections import OrderedDict

class Dag(Component):
    module = 'Dag'

    def __init__(self,data=None, **kwargs):
        self.code_generator = CodeGenerator()

        # Code is executed in evalscope dictionary
        self.evalscope = {}
        exec("import pymc3", self.evalscope)

        self.code = None

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

    def compile_graph(self,graph):
        self.code = self.code_generator.generate_code(graph)
        self.evaled_nodes = self.code_generator.evaled_nodes

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
            graph = message['body']
            self.compile_graph(graph)
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
        for node_id, node_name in self.evaled_nodes.items():
            try:
                msg_body[node_id] = list(np.histogram(self.evalscope['samples'][node_name])[0])
            except KeyError:
                pass
        return msg_body

    def __str__(self):
        return self.code


class CodeGenerator:
    def __init__(self):
        self.evalscope = {}
        self.evaled_nodes = OrderedDict()

    def generate_code(self,_graph):
        # print("eval scope = ",self.evalscope)
        graph = _graph['graph']
        order = _graph['order']
        #TODO number of samples as a user input
        n_samples = 10000
        context_manager = "with pymc3.Model() as model:\n"
        inference = "\n    approx = pymc3.fit(n=30000, method=pymc3.ADVI(), model=model)" \
                    "\n    samples = approx.sample({nsamples})".format(nsamples=n_samples)
        try:
            code = "".join([self._parse_node(graph['nodes'][str(node_id)]) for node_id in order])
        except:
            raise ValueError(graph['nodes'])
        return context_manager + code + inference

    def _parse_node(self,node,assign=True):

        # Data nodes are loaded to evalscope on initialisation
        if node['type'] == 'Data':
            return ''

        # Collect record of nodes in model
        self.evaled_nodes[node['nid']] = node['name']

        args = ','.join(["{name} = {value}".format(**x) for x in node['fields']['input'] if x['value'] != 'None'])

        if node['type'] == 'math.dot':
            return "    {name} = pymc3.{type}({args})\n".format(args=args,**node)

        if node['type'] == 'math.sum':
            expression = '+'.join(["{value}".format(**x) for x in node['fields']['input'] if x['value'] != 'None'])
            return "    {name} = {expression} \n".format(expression=expression,**node)

        if assign:
            return "    {name} = pymc3.{type}('{name}',{args})\n".format(args=args,**node)
        else:
            return "pymc3.{type}('{name}',{args})".format(args=args, **node)



