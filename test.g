{"connections": [{"from_node": "sigma", "from": "value", "to_node": 3, "to": "sd"}, {"from_node": "y", "from": "value", "to_node": 3, "to": "observed"}, {"from_node": 4, "from": "return", "to_node": 3, "to": "mu"}], "nodes": {"sigma": {"fields": {"out": [{"name": "value"}], "input": []}, "type": "Data", "nid": "sigma", "y": 100, "color": "#032b33", "data": {"freq": [], "bins": []}, "name": "sigma", "x": 444}, "y": {"fields": {"out": [{"name": "value"}], "input": []}, "type": "Data", "nid": "y", "y": 274, "color": "#032b33", "data": {"freq": [], "bins": []}, "name": "y", "x": 409}, "3": {"callable": "Normal", "fields": {"out": [{"name": "return"}], "input": [{"required": true, "value": "'obs'", "name": "name"}, {"required": false, "value": "", "name": "tau"}, {"required": false, "connected": true, "value": "sigma", "name": "sd"}, {"required": false, "connected": true, "value": "var4", "name": "mu"}, {"required": false, "connected": true, "value": "y", "name": "observed"}]}, "nid": 3, "y": 144, "module": "pymc3.distributions.continuous", "color": "black", "type": "distribution", "data": {"freq": [], "bins": []}, "name": "var3", "x": 660, "alias": ""}, "4": {"callable": "Normal", "fields": {"out": [{"name": "return"}], "input": [{"required": true, "value": "'mu'", "name": "name"}, {"required": false, "value": "", "name": "tau"}, {"required": false, "value": "1e6", "name": "sd"}, {"required": false, "value": "", "name": "mu"}, {"required": false, "value": "", "name": "observed"}]}, "nid": 4, "y": 56, "module": "pymc3.distributions.continuous", "color": "black", "type": "distribution", "data": {"freq": [1, 0, 1, 3, 4, 8, 7, 16, 19, 36, 40, 51, 62, 65, 105, 67, 79, 78, 87, 70, 62, 46, 31, 20, 17, 11, 4, 7, 1, 2], "min": -7.922911502477048, "max": 18.69662072600465, "median": 6.442495557460375, "mean": 6.384628209461767}, "name": "var4", "x": 153, "alias": ""}}}