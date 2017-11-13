import pymc3.distributions as dists
from collections import OrderedDict
from .floNodes import DistributionNode,TheanoOpNode
import inspect

node_types = OrderedDict()

for key,item in dists.__dict__.items():
    if inspect.isclass(item) and issubclass(item, dists.Distribution):
        node_types[key] = DistributionNode(item)


PyMC3Nodes = OrderedDict({key:item.to_json_dict() for key, item in node_types.items()})

for key,exp in {'add':'add','subtract':'sub','divide':'div',
                'multiply':'mul','power':'pow','modulo':'mod',
                'exponential':'exp','log':'log','square root':'sqrt'}.items():
    PyMC3Nodes.update({key:TheanoOpNode(exp).to_json_dict()})