from jupyter_react import Component

class Dag(Component):
    module = 'Dag'

    def __init__(self, **kwargs):
        super(Dag, self).__init__(target_name='react.dag', **kwargs)
        self.on_msg(self._handle_msg)
        self.code_generator = CodeGenerator()
        self.nodes = {}


    def _handle_msg(self, msg):
        message = msg['content']['data']
        if message['type'] == 'code_compile':
            graph = message['body']
            code = self.code_generator.generate_code(graph)
            self.send("Code Compile: \n {}".format(code))


class CodeGenerator:
    def __init__(self):
        pass

    def generate_code(self,_graph):
        graph = _graph['graph']
        order = _graph['order']
        try:
            code = "".join([self._parse_node(graph['nodes'][str(node_id)]) for node_id in order])
        except:
            raise ValueError(graph['nodes'])
        return code

    def _parse_node(self,node):
        if node['type'] == '_literal':
            return ''
        node_module,node_callable = node['type'].split(".")
        args = ','.join(["{name} = {value}".format(**x) for x in node['fields']['input'] if x['value'] != 'None'])

        if node_module == 'pymc3':
            return "{name} = {type}('{name}',{args})\n".format(args=args,**node)


class LiteralNode:
    def __init__(self):
        pass

    def __repr__(self):
        pass

class StochasticNode:
    def __init__(self,node):
        self.name = node.name
        self.type = node.type
        self.args = node.fields

