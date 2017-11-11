import inspect
import pymc3.distributions as dists
from collections import namedtuple, OrderedDict
from collections.abc import MutableMapping
field = namedtuple('field',['name','default'])


def is_required(arg):
    '''
    checks if an argument has no default value
    :param arg: inspect.parameter
    :return: bool
    '''
    return arg.default == inspect._empty


class NodeFields(MutableMapping):

    def __init__(self, node_args,bound=False, *args, **kwargs):
        if bound:
            self._storage = node_args
            return
        self._storage = {'out': [{'name': 'return'}], 'input': []}
        print(node_args.items())
        for arg_name, arg in node_args.items():
            if arg.kind in [0, 1, 3]:
                self._storage['input'].append({'name': str(arg_name), 'value': '', 'required': is_required(arg)})

    def __delitem__(self, key):
        return self._storage.__delitem__(key)

    def __setitem__(self, key, value):
        return self._storage.__setitem__(key, value)

    def __getitem__(self, key):
        return self._storage[key]

    def __iter__(self):
        return iter(self._storage)

    def __len__(self):
        return len(self._storage)

    def omit_fields(self, omit=None):
        """
        Returns dict for serialization, with 'omit' keys removed from inputs.
        Use to exclude arguments that will not be inputs in the frontend.
        :param omit: List of keys to omit from returned dict
        :return: dict {input:[...],output:[...]}
        """
        if omit is None:
            return self._storage
        return {'input':[input for input in self._storage['input'] if input['name'] not in omit],'out':self._storage['out']}


class Node:
    """
    Base Node for flowpy graph.
    """
    def __init__(self, wraps=None, nodetype=None, color='black', *args, **kwargs):
        """

        Node can be initialised using either a python object which is wrapped into a node (class or function),
        or with a node instance returned from the flowpy front end. To initialise a new node type, specify 'wraps' and
        'nodetype'. To initialise a node with values from the front end, specify 'node'.

        :param wraps: (obj, optional): A python classs or function to be serialised and sent to front end as a node.
        :param nodetype: (str, optional): An additional node descriptor used to sort nodes returned from the frontend.
        :param color: (str, optional): The color of the node type in the front end. Named colors or rgb string.
        :param args: (optional)
        :param kwargs: (optional)
        """
        self.return_template = "    {name} = {callable}('{name}',{args})\n"
        self.type = nodetype
        self.color = color

        self.node = None

        self.name = None
        self.module = None
        self.args = None
        self.fields = None

        self.bound = False
        self.varname = None

        if wraps is None:
            node = kwargs.get('node', None)
            if node is None:
                raise ValueError("Either wraps or node json dict required")
            else:
                self.parse_node(node)
        else:
            self.parse_wrapped(wraps)

    def parse_wrapped(self, cls):
        self.name = cls.__name__
        self.module = cls.__module__
        if self.module in ['builtins', '__main__']:
            self.module = ''
        self.args = args = OrderedDict(inspect.signature(cls.__init__).parameters)
        try:
            self.args.update(inspect.signature(cls).parameters)
        except ValueError:
            pass
        del self.args['self']
        self.fields = NodeFields(args)

    def parse_node(self,node):
        self.node = node
        self.type = node['type']
        self.module = node['module']
        self.name = node['callable']
        self.fields = NodeFields(node['fields'],bound=True)
        self.varname = node['name']
        self.args = self.bound_args()
        self.check_args_for_required()
        self.bound = True

    def __repr__(self):
        return "<Node> wraps {}.{}".format(self.module, self.name)

    def to_json_dict(self, omit=None, **kwargs):

        node_desc = {'type': self.type,
                     'module': self.module,
                     'callable': self.name,
                     'fields': self.fields.omit_fields(omit),
                     'color': self.color
                     }
        node_desc.update(kwargs)
        return node_desc

    def add_field(self, arg_name, required=False):
        self.fields['input'].append({'name': arg_name, 'value': '', 'required': required})

    def check_args_for_required(self):
        for arg in self.node['fields']['input']:
            if arg['value'] == '__required__':
                raise ValueError("Required argument {} missing in node {}".format(arg['name'], self.node['name']))

    def bound_args(self):
        args = {}
        for arg in self.fields['input']:
            args[arg['name']] = arg['value']
        return args

    def str_args(self):
        return ','.join(["{name} = {value}".format(**x) for x in self.node['fields']['input'] if x['value'] != ''])

    def __str__(self):
        return_template = "{varname} = {callable}({args})\n"
        return return_template.format(varname=self.varname,
                                      callable="{}.{}".format(self.module, self.name),
                                      args=self.str_args())


class DistributionNode(Node):
    def __init__(self, wraps=None, node=None):
        super(DistributionNode, self).__init__(wraps=wraps, node=node, nodetype="distribution")
        self.add_field('observed')

    def parse_node(self, node):
        super(DistributionNode, self).parse_node(node)
        self.name = self.args['name'].strip("'")


class ExpressionNode(Node):

    def __init__(self, expression, nodetype=None, color='green', node=None, *args, **kwargs):
        self.return_template = "    {name} = {module}.{callable}({args})\n"
        if node is not None:
            pass
        else:
            self.type = 'expression'
            self.name = expression
            self.module = 'theano.tensor'
            self.args = OrderedDict()
            self.fields = NodeFields(self.args)
            self.add_field('a')
            self.add_field('b')
            self.color = color

    def str_args(self):
        return ','.join(["{value}".format(**x) for x in self.node['fields']['input'] if x['value'] != ''])


node_types = OrderedDict()

for key,item in dists.__dict__.items():
    if inspect.isclass(item) and issubclass(item, dists.Distribution):
        node_types[key] = DistributionNode(item)

for key,item in dists.__dict__.items():
    if inspect.isclass(item) and issubclass(item, dists.Distribution):
        node_types[key] = DistributionNode(item)




node_types_json = OrderedDict({key:item.to_json_dict() for key, item in node_types.items()})

for key,exp in {'add':'add','subtract':'sub','divide':'div',
                'multiply':'mul','power':'pow','modulo':'mod',
                'exponential':'exp','log':'log','square root':'sqrt'}.items():
    node_types_json.update({key:ExpressionNode(exp).to_json_dict()})