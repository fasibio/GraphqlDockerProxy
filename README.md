# GraphqlDockerProxy
A generic Graphql Docker Proxy 

Its a GraphQL API Gateway. 
[![Docker Build Status](https://img.shields.io/docker/build/fasibio/graphqldockerproxy.svg)](https://hub.docker.com/r/fasibio/graphqldockerproxy/) 
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



