from jupyter_react import Component

class Dag(Component):
    module = 'Dag'

    def __init__(self, **kwargs):
        super(Dag, self).__init__(target_name='react.dag', **kwargs)
        self.on_msg(self._handle_msg)
    def _handle_msg(self, msg):
        message = msg['content']['data']
        if message['type'] == 'test':
            body = message['body']
            self.send("test message recieved, containing {}".format(body))
        if message['type'] == 'code_compile':
            graph = message['body']
            code = self.generate_code(graph)
            self.send("Code Compile: \n {}".format(code))



    def generate_code(self,graph):