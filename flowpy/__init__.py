from .dag import Dag

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'flowpy',
        'require': 'flowpy/index'
    }]
