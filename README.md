# GraphqlDockerProxy
A generic Graphql Docker Proxy 

It's a GraphQL API Gateway. 

[![Docker Build Status](https://img.shields.io/docker/build/fasibio/graphqldockerproxy.svg)](https://hub.docker.com/r/fasibio/graphqldockerproxy/) 
## How Does it Work: 
It works without dependencies. 
You can start it in your docker cloud. 
Use it to manage your GraphQL-Microservices. With docker labels you can registory your microservices in the proxy.
The proxy automatically will find your services and add them to the gateway.

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
You can do this with the following environment variables:
 - dockerNetwork: the network where the backend GraphQL-Server will run
 - gqlProxyToken: a token which verifies that the microservice belongs to the proxy 

 That's all!!
 Now you can open the proxy under http://127.0.0.1:3000/graphiql .
 The API is reachable under http://127.0.0.1:3000/graphql .

 At the moment it is an empty gateway. 

 ## Let's Start a GraphQL Microservice 

 It is imporant to put your microservice in the same network as the proxy (In this example the network is called 'web'). 
 Now you have to set the following labels: 
  - gqlProxy.token: The same token you set in the proxy. (In this example 1234)
  - gqlProxy.url: This is the relative path to the proxy running inside the container. (For example: :9000/graphql)
  - gqlProxy.namespace: The namespace that wraps your microservice.

  ## Let's Write an Example Microservice
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
Under http://127.0.0.1:3000/graphiql you can now see that swapi is now wrapping your graphql microservice. 
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

## Now Let's Scale the GraphQL Microservice !
The proxy knows how to reference the same images with a round robin loadbalancer. 

Go in the folder where the SWAPI service is. 

Enter the command: 
```sudo docker-compose scale swapi=3```

The proxy will automatically start a loadbalancer


## All About Namespaces
Namespaces are set by the GraphQl backend microservice, with the label ```gqlProxy.namespace```.
If you need more than one GraphQL backend server in the same namespace, then give the same name in the label ```gqlProxy.namespace```. The proxy will merge the services. 


### WARNING!!!!
At the moment it's not possible to have same queries, mutations or types for different entities. The proxy will use the first one it finds. 

### Note
You can find examples (and docker-compose files) in the example directory of this git project.

### TODO
Kubernetes Support - coming soon...



