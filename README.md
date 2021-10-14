## Introduction
The OEC Registry is the first container to start on the bus and monitors onboarding and offboarding assets as well as their audit trail

and their health state. It can be used to do a basic check on the stats of the assets and perform a simple conformity validation check.


![firefox_PunxEH5tof](https://user-images.githubusercontent.com/55870966/88534795-1d1dd980-d009-11ea-9a30-eb5094d54c77.png)

![firefox_glIWnXYIXJ](https://user-images.githubusercontent.com/55870966/88534811-24dd7e00-d009-11ea-8699-b6267e277cb8.png)

## Wiki
Most of the previous entries of this README were moved to the Wiki portion of the Repository ([Click](https://github.com/OI4/oi4-registry/wiki))

### Disclaimer:
The entire project is in a development stage until the final specification of the Development Guideline is finished. Use at own discretion.\
Take a look at the code examples, especially the ```src/Service/Proxy/Messagebus/index.ts``` *processMqttMessage* function and its calls. It is responsible for handling the OI4-Messagebus API.\
The main logic of the Registry can be found in ```src/Application/Registry/index.ts```.\
Also, take a look at ```src/Service/Utilities/OPCUABuilder/index.ts``` in order to understand how the OPCUA Json Payloads are built.\
The models are available in their respective folders.
