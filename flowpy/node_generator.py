import inspect
import json
import pymc3.distributions as dists
from collections import namedtuple, OrderedDict
from inspect import Parameter

field = namedtuple('field',['name','default'])


def is_required(arg):
    return arg.default == inspect._empty


def omit_fields(fields,omit=None):
    if omit is None:
        return fields
    return {'input':[input for input in fields['input'] if input['name'] not in omit],'out':fields['out']}

class Node:
    def __init__(self,cls,type=None,color='black',node=None,*args,**kwargs):
        self.type = type
        self.name = cls.__name__
        self.module = cls.__module__
        self.args = OrderedDict(inspect.signature(cls.__init__).parameters)
        self.args.update(inspect.signature(cls).parameters)
        del self.args['self']
        self.fields = self._args_to_fields()
        self.color = color

    def __repr__(self):
        return "<Node> wraps {}.{}".format(self.module,self.name)

    def to_json(self,omit = None, **kwargs):

        node_desc = {'type': self.type,
                     'module': self.module,
                     'callable': self.name,
                     'fields': omit_fields(self.fields,omit),
                     'color': self.color
                     }
        node_desc.update(kwargs)
        return node_desc

    def _args_to_fields(self):

        fields = {'out': [{'name': 'return'}], 'input': []}

        for arg_name, arg in reversed(self.args.items()):
            if arg.kind in [0, 1, 3]:
                fields['input'].append({'name': str(arg_name), 'value': '','required':is_required(arg)})
        return fields

    def add_field(self,arg_name,required=False):
        self.fields['input'].append({'name': arg_name, 'value': '', 'required': required})

    def str_args(self):
        return ','.join(["{name} = {value}".format(**x) for x in self.fields['input']])

    def __str__(self):
        return_template = "{varname} = {callable}({args})\n"
        return return_template.format(varname=self.varname,
                                      callable="{}.{}".format(self.module,self.name),
                                      args=self.str_args())


class DistributionNode(Node):
    color = 'black'
    def __init__(self, cls):
        super(DistributionNode, self).__init__(cls,type="distribution")
        self.add_field('observed')

node_types = {}

for key,item in dists.__dict__.items():
    if inspect.isclass(item) and issubclass(item, dists.Distribution):
        node_types[key] = DistributionNode(item)


node_types_json = {key:item.to_json() for key, item in node_types.items()}

def b(a,b):
    pass