import inspect
from collections import namedtuple, OrderedDict
from collections.abc import MutableMapping


def is_required(arg):
    '''
    checks if an argument has no default value
    :param arg: inspect.parameter
    :return: bool
    '''
    return arg.default == inspect._empty


class NodeFields(MutableMapping):
    """
    Stores bound fields from frontend instance or unbound fields from inspect signature of obj wrapped by Node.
    """
    def __init__(self, node_args,bound=False, *args, **kwargs):
        self.bound = bound
        if bound:
            print("NODE ARGS BOUND: ",node_args)
            self._storage = node_args
            print(self._storage)
            self.check_args_for_required()
            return
        self._storage = {'out': [{'name': 'return'}], 'input': []}
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

    def add_field(self, arg_name, required=False):
        self._storage['input'].append({'name': arg_name, 'value': '', 'required': required})

    def check_args_for_required(self):
        """
        Raises ValueError if bound args is missing value for required arg.
        :return: None
        """
        for arg in self._storage['input']:
            if arg['value'] == '__required__':
                raise ValueError("Required argument {} missing in node {}".format(arg['name'], self._storage['name']))

    @property
    def bound_args(self):
        """
        Returns bound args from frontend instance as dict.
        :return: (dict): {arg_name:bound_value}
        """
        if not self.bound:
            raise ValueError("Node does not contain bound arguments.")
        args = {}
        for arg in self._storage['input']:
            args[arg['name']] = arg['value']
        return args


class Node:
    """
    Base Node for flowpy graph.
    """
    def __init__(self, wraps=None, nodetype=None, color='black', *args, **kwargs):
        """

        Node can be initialised using either a python object which is wrapped into a node (class or function),
        or with a node instance returned from the flowpy front end. To initialise a new node type, specify 'wraps' and
        'nodetype'. To initialise a node with values from the front end, specify 'node'.

        Args:
            :param wraps: (obj, optional): A python classs or function to be serialised and sent to front end as a node.
            :param nodetype: (str, optional): An additional node descriptor used to sort nodes returned from the frontend.
            :param color: (str, optional): The color of the node type in the front end. Named colors or rgb string.
            :param args: (optional)
            :param kwargs: (optional)

        Attributes:
            return_template (str): Description of `attr1`.
            type (str): Descriptive string used to map frontend instance to Node class or subclass.
            node (dict): Frontend node instance as dict.
            name (str): Name of wrapped object.
            module (str): Module from which wrapped object is derived.
            args (dict): Dictionary of arguments from a wrapped python callable object.
            fields (dict): Dict containing 'input' and 'out' keys, which contain list of node arguments.
            varname (str): Name for variable in which the return value of the node is stored when executed.
            bound (bool): Is the node instance bound to a frontend node instance.
            boundargs (dict): Dict of arguments and values from frontend.
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
                raise ValueError("Either 'wraps' or 'node' dict required")
            else:
                self.parse_node(node)
        else:
            self.parse_wrapped(wraps)

    def parse_wrapped(self, cls):
        self.name = cls.__name__
        self.module = cls.__module__
        if self.module in ['builtins', '__main__']:
            self.module = ''
        args = OrderedDict(inspect.signature(cls.__init__).parameters)
        try:
            args.update(inspect.signature(cls).parameters)
        except ValueError:
            pass
        if 'self' in args:
           del args['self']
        self.fields = NodeFields(args)

    def parse_node(self,node):
        self.bound = True
        self.node = node
        self.type = node['type']
        self.module = node['module']
        self.name = node['callable']
        self.fields = NodeFields(node['fields'], bound=True)
        self.varname = node['name']

    def add_field(self, arg_name, required=False):
        self.fields.add_field(arg_name, required)

    def __repr__(self):
        return "<Node> wraps {}.{}".format(self.module, self.name)

    def to_json_dict(self, omit=None, **kwargs):
        """
        Returns dictionary suitable for serialization to json to be sent to frontend.
        :param omit: (list: str, optional): List of inputs to be stripped from fields.
        :param kwargs: additional fields to be sent to frontend
        :return: (dict): {'type':(str),
                          'module':(str),
                          'callable':(str),
                          'fields':{'input':(list),'output'(list)},
                          'color':(str)}
        """
        node_desc = {'type': self.type,
                     'module': self.module,
                     'callable': self.name,
                     'fields': self.fields.omit_fields(omit),
                     'color': self.color
                     }
        node_desc.update(kwargs)
        return node_desc

    def str_args(self):
        """
        Formats nodes argument dict for use in the __str__ method.
        :return: (str): comma separated arguments with bound values
        """
        if not self.bound:
            return ''
        print(self.fields.bound_args.items())
        return ','.join(["{name} = {value}".format(name=name, value=value) for name, value in self.fields.bound_args.items() if value != ''])

    def __str__(self):
        """
        Returns a string representation of the node with bound arguments that can be evaluated via 'exec'
        :return: (str): executable string
        """
        return_template = "{varname} = {callable}({args})\n"
        return return_template.format(varname=self.varname,
                                      callable="{}.{}".format(self.module, self.name),
                                      args=self.str_args())


class DistributionNode(Node):
    """
    PyMC3 distributions node.
    Adds an 'observed' input field and deals with parsing the RV name from the frontend.
    Default color: black
    """
    def __init__(self, wraps=None, node=None):
        super(DistributionNode, self).__init__(wraps=wraps, node=node, nodetype="distribution")

    def parse_wrapped(self, cls):
        super(DistributionNode, self).parse_wrapped(cls)
        self.add_field('observed')

    def parse_node(self, node):
        super(DistributionNode, self).parse_node(node)
        self.sample_name = self.fields.bound_args['name'].strip("'")


class TheanoOpNode(Node):
    """
    Theano operator node.
    Overrides wrapping method as theano ops do not expose name or module.
    Op is set as expression=(str) which is the name of a theano tensor operation.
    Adds two inputs, 'a' and 'b', for binary ops.
    Default color: green
    """
    def __init__(self, wraps=None, color='#344e30', node=None, *args, **kwargs):
        super(TheanoOpNode,self).__init__(wraps=wraps, node=node, color=color)

    def parse_wrapped(self, expression):
            self.type = 'expression'
            self.name = expression
            self.module = 'theano.tensor'
            self.args = OrderedDict()
            self.fields = NodeFields(self.args)
            self.add_field('a')
            self.add_field('b')

    def str_args(self):
        return ','.join(["{value}".format(**x) for x in self.node['fields']['input'] if x['value'] != ''])


class NullNode:
    def __init__(self,*args,**kwargs):
        pass
    def __str__(self):
        return ''


DataNode = NullNode