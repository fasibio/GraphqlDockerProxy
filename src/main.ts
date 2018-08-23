import { ApolloServer } from 'apollo-server-express';
import * as express from 'express';
import { weaveSchemas } from 'graphql-weaver';
import { DockerFinder } from './finder/dockerFinder/dockerFinder';
import { K8sFinder } from './finder/k8sFinder/k8sFinder';
import { K8sWatcher } from './watcher/k8s/K8sWatcher';
import {
  runtime,
  getPollingMs,
  printAllConfigs,
  adminPassword,
  adminUser,
  showPlayground,
  getBodyParserLimit,
} from './properties';
import  { Endpoints } from './finder/findEndpointsInterface';
import { sortEndpointAndFindAvailableEndpoints } from './finder/endpointsAvailable';
import adminSchema from './admin/adminSchema';
import * as basicAuth from 'express-basic-auth';
import * as cluster from 'cluster';
import cloner from 'cloner';
import { DockerWatcher } from './watcher/docker/DockerWatcher';
// import deepcopy from 'deepcopy/cjs/index'
import { getMergedInformation } from './schemaBuilder';
require('./idx');
require('./logger');
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});
const weaverIt = async(endpoints) => {
  try {
    return await weaveSchemas({
      endpoints,
    });
  } catch (e) {
    winston.error('WeaverIt goes Wrong', e);
  }

};

const run = async() => {

  switch (runtime()){
    case 'kubernetes': {
      winston.info('Start IT');
      winston.info('With Configuration: ');
      printAllConfigs();
      runPoller(new K8sFinder());
      break;
    }
    case 'docker': {
      winston.info('Start IT');
      winston.info('With Configuration: ');
      printAllConfigs();
      runPoller(new DockerFinder());
      break;
    }

    case 'kubernetesWatch': {
      winston.info('Start IT');
      winston.info('With Configuration: ');
      printAllConfigs();
      const watcher = new K8sWatcher();
      let myEndpoints = {};
      watcher.setDataUpdatedListener((endpoints) => {
        winston.info('Watcher called new endpoints ');
        myEndpoints = endpoints;
      });

      watcher.watchEndpoint();
      setInterval(() => {
        startWatcher(cloner.deep.copy(myEndpoints));
      },          getPollingMs());

      break;
    }
    case 'dockerWatch': {
      const dockerWatcher = new DockerWatcher();
      dockerWatcher.watchEndpoint();
    }

  }

};

// start and restart by listener
let lastEndPoints : string = '';
let server = null;
const startWatcher = async(end: Endpoints) => {
  const endpoints = await sortEndpointAndFindAvailableEndpoints(end);
  if (JSON.stringify(endpoints) !== lastEndPoints) {
    winston.info('Changes Found restart Server');
    if (server != null) {
      server.close();
    }

    lastEndPoints = JSON.stringify(endpoints);
    // $FlowFixMe: suppressing this error until we can refactor
    // cluster.schedulingPolicy = cluster.SCHED_RR
    // if (cluster.isMaster){
    //   var cpuCount = require('os').cpus().length
    //   for (var i = 0; i < cpuCount; i += 1) {
    //     console.log('START SLAVE')
    //     cluster.fork()
    //   }
    // } else {
    server = await start(endpoints);
    // }

  } else {
    winston.info('no Change at endpoints does not need a restart');
  }
};
const runPoller = (finder) => {

  setInterval(async() => {
    try {
      let endpoints : Endpoints = await finder.getEndpoints();
      endpoints = await sortEndpointAndFindAvailableEndpoints(endpoints);
      if (JSON.stringify(endpoints) !== lastEndPoints) {
        winston.info('Changes Found restart Server');
        if (server != null) {
          server.close();
        }

        lastEndPoints = JSON.stringify(endpoints);
        process.env.NODE_CLUSTER_SCHED_POLICY = 'rr';
        if (cluster.isMaster) {
          const cpuCount = require('os').cpus().length;
          for (let i = 0; i < cpuCount; i += 1) {
            winston.info('START SLAVE');
            cluster.fork();
          }
        } else {
          server = await start(await finder.handleRestart(endpoints));
        }

      } else {
        winston.info('no Change at endpoints does not need a restart');
      }
    } catch (e) {
      winston.error('GLOBAL ERROR', e);
      lastEndPoints = '';
    }

  },          getPollingMs());
};
// const oldSchema = null

const start = async(endpoints : Endpoints) => {
  winston.info('loading endpoints:', { endpoints });
  const weaverEndpoints = [];

  for (const one in endpoints) {
    weaverEndpoints.push({
      namespace: one,
      typePrefix: one + '_',
      schema: await getMergedInformation(endpoints[one]),
    });
  }
  const schema = await weaverIt(weaverEndpoints);
  let schemaMerged = null;
  // if (knownOldSchemas() == 'true'){

  //   if (oldSchema != null){
  //     console.log('merge Old and New Schemas. to known old Schemas', oldSchema)
  //     schemaMerged = mergeSchemas({
  //       schemas: [schema, oldSchema],
  //     })
  //   } else {
  schemaMerged = schema;
  // }

  // oldSchema = deepcopy(schemaMerged)
  // }
  const app = express();
  let playground: any = false;
  if (showPlayground()) {
    playground = {
      tabs: [{
        endpoint: '/graphql',

      },
        {
          endpoint: '/admin/graphql',
          headers: {
            Authorization: 'Basic YOURBasicAuth',
          },
        },
      ],

    };
  }
  const apiServer = new ApolloServer({
    playground,
    schema: schemaMerged,
    introspection: true,
    context: (obj) => {
      return {
        headers: obj.res.req.headers,
      };
    },
  });
  apiServer.applyMiddleware({
    app,
    path: '/graphql',
    bodyParserConfig: { limit: getBodyParserLimit() },

  });

  app.get('/health', (req, res) => {
    res.status(200);
    res.send('OK');

  });

  if (adminUser() !== '') {
    const users = {};
    users[adminUser()] = adminPassword();
    app.use(basicAuth({
      users,
      challenge: true,
    }));
  }

  const adminServer = new ApolloServer({
    playground,
    introspection: true,
    context: {
      endpoints: await endpoints,
    },
    schema: adminSchema,
  });
  adminServer.applyMiddleware({
    app,
    bodyParserConfig: true,
    path: '/admin/graphql',
  });

  winston.info('Server running. Open http://localhost:3000/graphql to run queries.');
  if (server != null) {
    server.close();
  }
  return app.listen(3000);
};

run();
