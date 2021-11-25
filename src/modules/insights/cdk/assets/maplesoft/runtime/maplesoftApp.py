# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from __future__ import print_function
from fmpy import read_model_description, extract
from fmpy.fmi2 import FMU2Slave
import time as TIME
import json
import os
import flask

sync = True
step_size = 1
stop_time = 10
prefix = '/opt/ml/'
model_path = os.path.join(prefix, 'model')
model_tar_extension = '.fmu'

my_inputs = None
my_outputs = None
fmu = None

class Twin(object):
  model = None
  def initialize(self):
    print('Loading model')
    # read the model description
    for file in os.listdir(model_path):
      if(file.lower().endswith(model_tar_extension) and not file.lower().startswith('._')):
        fmu_model_path = os.path.join(model_path, file)
        model_description = read_model_description(fmu_model_path)

    # collect the value references
    vrs = {}
    for variable in model_description.modelVariables:
        vrs[variable.name] = variable.valueReference

    # get the value references for the variables/parameters we want to get/set
    global my_inputs
    global my_outputs
    my_inputs = [vrs['RPM']]
    my_outputs = [vrs['Power']]

    # extract the FMU
    unzipdir = extract(fmu_model_path)

    global fmu
    fmu = FMU2Slave(guid=model_description.guid,
                    unzipDirectory=unzipdir,
                    modelIdentifier=model_description.coSimulation.modelIdentifier,
                    instanceName='instance1')

    # instantiate
    fmu.instantiate()
    fmu.setupExperiment(startTime=(TIME.time() - 86400))

    # setting parameters

    # initialize
    fmu.enterInitializationMode()
    fmu.exitInitializationMode()
    self.model = fmu

  def simulate_step(self, end_time, inputs):
    print('Set input for the next simulation')
    for input_name in inputs:
        print('Setting {} to {}'.format(input_name, inputs[input_name]))

    print('Step to time {}'.format(end_time))

    # set the inputs
    fmu.setReal(my_inputs, [ inputs["RPM"] ])

    fmu.doStep(currentCommunicationPoint=end_time, communicationStepSize=step_size)

    # Gather output
    outputs = fmu.getReal(my_outputs)

    print('Simulation outputs {}'.format(outputs))
    return outputs

twin = Twin()

twin.initialize()
app = flask.Flask(__name__)

@app.route('/ping', methods=['GET'])
def ping():
    """Determine if the container is working and healthy."""
    status = 200 if twin.model else 404
    return flask.Response(response='\n', status=status, mimetype='application/json')

@app.route('/invocations', methods=['POST'])
def simulate_handler():
    global twin
    if twin is None:
        return 'Twin is not initialized. Please check Cloudwatch log.', 400

    print('Request simulation')
    body = flask.request.get_json()
    print('received request {}'.format(body))
    end_time = body['end_time']
    inputs = body['inputs']
    print('End time: {}'.format(end_time))
    print('Inputs: {}'.format(inputs))
    outputs = twin.simulate_step(end_time, inputs)

    return json.dumps({
        "end_time": end_time,
        "outputs": {
            "Power": outputs[0]
        }
    })
