import pymc3.distributions
from collections import OrderedDict, MutableMapping
from .floNodes import DistributionNode,TheanoOpNode, NullNode, DataNode, Node
import inspect


class SerializeNodeMapping(MutableMapping):
    """
    Provides a dict of serializable node types.
    """
    def __init__(self,node_cls,filter=None):
        self._storage = {}
        self.node_cls = node_cls
        if filter is None:
            self.filter = lambda x: True
        else:
            self.filter = filter

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

    def update(self, *args, **kwds):
        self._storage.update(*args,**kwds)

    def from_dict(self, dict):
        for key, item in dict.items():
            if self.filter(item):
                self._storage[key] = self.node_cls(wraps=item)
        return self

    def __call__(self, *args, **kwargs):
        return OrderedDict({key: item.to_json_dict() for key, item in self._storage.items()})


def _pymc3_node_filter(item):
    return inspect.isclass(item) and issubclass(item, pymc3.distributions.Distribution)

pymc3Nodes = SerializeNodeMapping(DistributionNode, _pymc3_node_filter).from_dict(pymc3.distributions.__dict__)

_theanoOps = {'add': 'add', 'subtract': 'sub', 'divide': 'div',
              'multiply': 'mul', 'power': 'pow', 'modulo': 'mod',
              'exponential': 'exp', 'log': 'log', 'square root': 'sqrt'}

theanoNodes = SerializeNodeMapping(TheanoOpNode).from_dict(_theanoOps)

pymc3Nodes.update(theanoNodes)

node_mapping = {'expression': TheanoOpNode,
                'distribution': DistributionNode,
                'function': Node,
                'data': DataNode}


