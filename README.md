![Logo](/doc/assets/logo.png)
# GraphqlDockerProxy

It's a generic Graphql Proxy Api Gateway.

To build Graphql microservices and combine this automatically, in one API, without extra Code.


[![Docker Build Status](https://img.shields.io/docker/build/fasibio/graphqldockerproxy.svg)](https://hub.docker.com/r/fasibio/graphqldockerproxy/) 
[![pipeline status](https://gitlab.com/fasibio/GraphqlDockerProxy/badges/master/pipeline.svg)](https://gitlab.com/fasibio/GraphqlDockerProxy/commits/master)
[![coverage report](https://gitlab.com/fasibio/GraphqlDockerProxy/badges/master/coverage.svg)](https://fasibio.gitlab.io/GraphqlDockerProxy)

![oh man get image not visible](/doc/assets/kontext.png?raw=true)

# Features
 - Continuously integrates the Backend GraphQL Nodes (**No restart!**)
 - !!!It works with **Docker** and **Kubernetes**!!!
 - Supports load balancing (with docker)


# Run with Docker (5 Minutes Quickstart)<a name="runWithDocker"></a>

### Note
You can find examples docker-compose files in the example directory of this git project ([./example/quickstart](/example/quickstart)).

## How Does it Work: 
- It works without dependencies. 
- You can start it in your docker cloud. 
 - Use it to manage your GraphQL-Microservices. With docker labels you can registry your microservices in the proxy.
- The proxy automatically will find your services and add them to the gateway.

## How to Start the Proxy
In this example we will use docker-compose to start the proxy. 
Here is an example docker-compose file: 
```
version: '3'
services: 
  api: 
    restart: always
    image: fasibio/graphqldockerproxy
    expose:
      - 3000
    ports:
      - 3000:3000
    networks:
     - web
    environment: 
      - qglProxyRuntime=dockerWatch
      - dockerNetwork=web
      - gqlProxyToken=1234
    volumes: 
     - /var/run/docker.sock:/var/run/docker.sock
networks:
  web:
    external: true
```
This will start the proxy on port 3000. 
It's important to include the ```docker.sock``` as volume.

 **That's all!!**

 Now you can open the proxy playground under http://127.0.0.1:3000/graphql .
 The API is reachable under http://127.0.0.1:3000/graphql too.

 At the moment it is an empty gateway. 

 ## Let's Start a GraphQL Microservice 


  For this example we will use the Docker image ```bfillmer/graphql-swapi```

  Create a docker-compose file: 
  ```
  version: '3'
  services: 
    swapi: 
      image: bfillmer/graphql-swapi
      expose:
        - 9000
      networks: 
        - web
      labels: 
        - gqlProxy.token=1234
        - gqlProxy.url=:9000/graphql
        - gqlProxy.namespace=swapi
networks:
    web:
      external: true
  ```

Start the docker-compose file. 
The proxy will automatically find the microservice and include it.
Under http://127.0.0.1:3000/graphql you can now see that swapi has wrapped your graphql microservice.

Inside this namespace you can make graphql requests. 
For example:
```
{
  swapi{
    allFilms{
      films{
        title
      }
    }
  }
}
```

Or you can use the admin Page to see what has been included http://127.0.0.1:3000/admin/graphql (See the second tab at playground)


 It is important to put your microservice in the same network as the proxy (In this example the network is called 'web'). 
 We have to set the following labels, so that the Api can find the service: 
  - ```gqlProxy.token```: The same token you set in the proxy. (In this example 1234)
  - ```gqlProxy.url```: This is the relative path to the proxy running inside the container. (For example: :9000/graphql)
  - ```gqlProxy.namespace```: The namespace that wraps your microservice.

## Now Let's Scale the GraphQL Microservice !
The proxy knows how to reference the same images with a round robin loadbalancer. 

Go in the folder where the SWAPI docker-compose file is. 

Enter the command: 
```sudo docker-compose scale swapi=3```

The proxy will automatically start a loadbalancer


**And thats all!**
Now you can add you Graphql microservices by adding the labels to your compose file and set the same Network (for example 'web').


# Run with Kubernetes (18min example)

It will use the Kubernetes API to find available GraphQL Endpoints. 

General use is the same like docker. 
See [how it works with Docker](#runWithDocker).
You have to set labels in the Deployment-Manifest.

- ```kubernetesConfigurationKind```: How the proxy find the Kubernetes API. 
  - ```fromKubeconfig```: A Config file which is mount in the Container
  - ```getInCluster```: The POD as it self.
  - ```getInClusterByUser```: The POD as it self but with a spezial self set user 

([example Configurations](#possibleK8sCombinations))

([also see this full configuration description ](#availableEndpoints))


([see ./example/kubernetes](/example/kubernetes)).

## The Yaml for the GraphQL Proxy:

Deployment.yaml
```
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  annotations:
    kompose.cmd: kompose convert
    kompose.version: 1.13.0 (84fa826)
  creationTimestamp: null
  labels:
    io.kompose.service: api
  name: api
  namespace: gqlproxy
spec:
  replicas: 1
  strategy: {}
  template:
    metadata:
      creationTimestamp: null
      labels:
        io.kompose.service: api
    spec:
      containers:
      - env:
        - name: gqlProxyToken
          value: "1234"
        - name: kubernetesConfigurationKind
          value: getInCluster
        - name: qglProxyRuntime
          value: kubernetesWatch
        image: fasibio/graphqldockerproxy
        name: api
        ports:
        - containerPort: 3000
        resources: {}
      restartPolicy: Always
status: {}

---
kind: Service
apiVersion: v1
metadata:
  labels:
    name: api
  name:      api
  namespace: graphqlproxy
spec:
  ports:
    - port: 3000
      targetPort: 3000
      name: http
  selector:
    app: api

```


## The Yaml for the GraphQL (SWAPI)

Here it is importend that the ```service``` have the ```annotations``` 
  - ```gqlProxy.token```: The same token you set in the proxy. (In this example 1234)
  - ```gqlProxy.url```: This is the relative path to the proxy running inside the container. (For example: :9000/graphql)
  - ```gqlProxy.namespace```: The namespace that wraps your microservice queries.


```
---
kind: Deployment
apiVersion: extensions/v1beta1
metadata:
  
  labels:
    app:     swapi
  name:      swapi
  namespace: starwars
spec:
  minReadySeconds: 20
  replicas: 2
  revisionHistoryLimit: 32
  template:
    metadata:
      name: swapi
      labels:
        app: swapi
    spec:
      terminationGracePeriodSeconds: 1
      containers:
        - image: bfillmer/graphql-swapi
          imagePullPolicy: Always
          name: swapi
          ports:
            - containerPort: 9000
              name: http-port
---
kind: Service
apiVersion: v1
metadata:
  annotations:
    gqlProxy.token: '1234'
    gqlProxy.url: ':9001/graphql'
    gqlProxy.namespace: 'swapi'
  labels:
    name: swapi
  name:      swapi
  namespace: starwars
spec:
  ports:
    - port: 9001
      targetPort: 9000
      name: http
  selector:
    app: swapi

```

Thats it ! Now you have the API running under Kubernetes. 

## All About Namespaces<a name="allAboutNamespaces"></a>
Namespaces are set by the GraphQl backend microservice, with the label ```gqlProxy.namespace```.
If you need more than one GraphQL backend server in the same namespace, then give the same name in the label ```gqlProxy.namespace```. The proxy will merge the services. 


### WARNING!!!!
At the moment it's not possible to have same queries, mutations or types for different entities. The proxy will use the first one it finds. 


# Admin page / Metadata Page

To see what the proxy has included and there is another graphql service under ```/admin/graphql``` as well. 
Here you can see all of the namespaces and endpoint metadata for the included proxy nodes.
If an endpoint being served by a loadbalancer, then you can also find the "real" endpoints. 

Set the environment variables, ```gqlProxyAdminUser``` and ```gqlProxyAdminPassword```, to configure a Basic Auth for the admin page.

## Available Environments for the GraphQL Proxy<a name="availableEndpoints"></a>

Key | Available Values | Default | Description | Need for | Required 
--- | --- | --- | --- | --- | ---
| ```qglProxyRuntime``` |  ```dockerWatch``` or  ```kubernetesWatch``` | ```dockerWatch``` | tells the proxy run to in a docker image or in a kubernetes "world" | docker and kubernetes | true 
|```dockerNetwork``` | string | none | the network where the backend GraphQL-Server is shared with the proxy|  ```dockerWatch```| for docker
| ```gqlProxyToken``` | string | empty string | a token which verifies that the microservice belongs to the proxy |  ```dockerWatch``` or ```kubernetesWatch``` | false but better you set it
|```kubernetesConfigurationKind``` | ```fromKubeconfig``` or ```getInCluster``` or ```getInClusterByUser``` | ```fromKubeconfig``` | How the proxy finds the Kubernetes API config. | ```kubernetesWatch``` | false
|```gqlProxyPollingMs```| int | 5000 | The polling time to check for changes (send introspection Query) |  all | false
|```gqlProxyK8sUser```| string | no Default | The K8s user. This is only needed for configuration type ```getInClusterByUser```. |  ```kubernetesWatch``` | false
|```gqlProxyK8sUserPassword```| string | no Default |  The password for the K8s user. This is only needed for configuration type ```getInClusterByUser```. |  ```kubernetesWatch``` | false
|```gqlProxyAdminUser```| string | empty string | The Basic Auth user for the admin page |  all | false
|```gqlProxyAdminPassword```| string | empty string | The Basic Auth password for the admin page |  all | false
|```gqlShowPlayground```| bool | true | toggle graphql playground ui on and off |  all | true
|```gqlBodyParserLimit```| string| 1mb | Set the body size limit for big Data | all | false
|```winstonLogLevel```| string| ```info``` | Set standart loglevel for winston e.g: ```debug```, ```info```, ```warn``` ```error``` | all | false
|```winstonLogStyle```| string| ```simple``` | Set the style to logging for winston ```simple``` or ```json``` | all | false
|```enableClustering```| bool | ```false``` | Staring a cluster set a proxy for each cpu kernel. (sometimes can bring more boost) | all | false
|```sendIntrospection```|bool | ```true```| if it true: client can see the structure. if it false: no introspection will be send. **For more __security__ Set to false in Produktion mode** | all| false
|```gqlApolloEngineApiKey```|string| empty string | The apollo Engine Key (after login by apollo you get this key)|all| false
### Possible Environment Variable Combinations for Docker
  - ```qglProxyRuntime```=dockerWatch
  - ```dockerNetwork```=web



 ## Available Labels/Annotations for all GraphQL Endpoints

Key | Available Values |  Description | Required 
--- | --- | --- | --- 
| ```gqlProxy.token``` |string | The same token you set in the proxy. (In this example 1234) | true 
|```gqlProxy.url``` | string |  This is the relative path to the proxy running inside the container. (For example: :9000/graphql)| true
| ```gqlProxy.namespace``` | string  | The namespace that wraps your microservice.  See ["All About Namespaces"](#allAboutNamespaces) for more information| true


### Possible Environment Variable Combinations for Kubernetes<a name="possibleK8sCombinations"></a>

### Watching: 
  #### For a User in the Pod
  - ```qglProxyRuntime```=kubernetesWatch
  - ```kubernetesConfigurationKind```=getInCluster

  #### For an Explicit User
  - ```qglProxyRuntime```=kubernetesWatch
  - ```kubernetesConfigurationKind```=getInClusterByUser
  - ```gqlProxyK8sUser```=myK8sUser
  - ```gqlProxyK8sUserPassword```=thePassword

### For All of the Above
  - ```gqlProxyPollingMs```=10000
  - ```gqlProxyAdminUser```=myAdminPageUser
  - ```gqlProxyAdminPassword```=adminPassword
 
 # and finally
 
 If you find a bug, have questions please open an issue. 
 
 Have fun.
