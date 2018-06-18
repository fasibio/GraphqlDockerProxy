# GraphqlDockerProxy
A generic Graphql Docker Proxy 

Its a GraphQL API Gateway. 

[![Docker Build Status](https://img.shields.io/docker/build/fasibio/graphqldockerproxy.svg)](https://hub.docker.com/r/fasibio/graphqldockerproxy/) 

It works with docker and Kubernetes
# Run with docker
## How does it works: 
It works standalone. 
So you can start it in your docker cloud. 
And wirte many small GraphQL-Mikroservices. Over docker labels you can "registry" your Mikroservices to the Proxy. 
The Proxy will find them and add them to his self. 

## Lets Start the Proxy
In this example we will you docker-compose to start the Proxy. 
Here is a example docker-compose file: 
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
      - dockerNetwork=web
      - gqlProxyToken=1234
    volumes: 
     - /var/run/docker.sock:/var/run/docker.sock
networks:
  web:
    external: true
```
This will start the Proxy on Port 3000. 
Its importend to include the ```docker.sock```as volume.
You have to set to enviroments. 
 - dockerNetwork: the Network where all Backend Graphqlserver will be include
 - gqlProxyToken: a token which specified which backend GraphQL Server is think for this Proxy. 

 Thats all!!
 Now you can open the Proxy under http://127.0.0.1:3000/graphiql .
 The API is reachable under http://127.0.0.1:3000/graphql .

 At the moment it is an empty Gateway. 

 ## Lets start a GraphQL Microservice 

 At you Backend GraphQL-Client it is important to put them in the same Network (In this example it calls web). 
 Now you have to set the following Label: 
  - gqlProxy.token: the same token where you have set in the proxy. (In this example 1234)
  - gqlProxy.url: this is a little bit false named. Here you have to set the intern "relativ Path" where the Graphql server is running inside the container. For Example: :9000/graphql
  - gqlProxy.namespace: a name Space where it will be hanging into the Proxy.

  ## Lets write a Example of a GraphQL Backend: 
  For this example we will use the Dockerimage ```bfillmer/graphql-swapi```

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

Start the compose file. 
The Proxy will automatic find the Service and include them. 
Under http://127.0.0.1:3000/graphiql you can now see that the service have a namespace swapi. 
Inside this namespace you talk with the graphql-swapi Mikroservice. 
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

## Now lets scale the Graphql Mikroservice !
The Proxy know same Images a make a round robin Lolabalance. 

Go in the Folder where the SWAPI Service is. 

Send the Command ```sudo docker-compose scale swapi=3```
The Proxy will known that and Start a Lolabalance


## all About Namespaces
Namespaces are set by the GraphQl Backend Mikroservice (with the label ```gqlProxy.namespace```)
If you need more than one GraphQL Backend Server with in the same Namespace, both have to give the same name in there label ```gqlProxy.namespace```. The Proxy will merge it. 


### WARNING!!!!
At the Moment its not possible to have same named Query or same type with different entitys. The Proxy will use the first one he found. 

## Something else 
In the Folder example you find the docker-compose files for this example. 



# Run with Kubernetes

Complete Doku will coming soon. 

At the Moment: Read the "How it works with Docker". 
And here example Kubernetes yaml files. 
##The Yaml for the Proxy:

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
        - name: dockerNetwork
          value: web
        - name: gqlProxyToken
          value: "1234"
        - name: kubernetesConfigurationKind
          value: getInCluster
        - name: qglProxyRuntime
          value: kubernetes
        image: fasibio/graphqldockerproxy
        name: api
        ports:
        - containerPort: 3000
        resources: {}
      restartPolicy: Always
status: {}

```

serice.yaml
```
apiVersion: v1
kind: Service
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
  ports:
  - name: "3000"
    port: 3000
    targetPort: 3000
  selector:
    io.kompose.service: api
status:
  loadBalancer: {}

```

## The Yaml for the GraphQL (SWAPI)

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
          # readinessProbe:
          #   httpGet:
          #     port: http-port
          #     path: /
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