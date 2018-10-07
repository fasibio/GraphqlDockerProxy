
export const network = () => {
  return process.env.dockerNetwork || 'web'
}

export const token = () => {
  return idx(process, _ => _.env.gqlProxyToken) || ''
}

export const getVersion = () => {
  return idx(process, _ => _.env.VERSION)
}

export const getBuildNumber = () => {
  return idx(process, _ => _.env.BUILD_NUMBER)
}

/**
 * Set set loglevel
 * debug, info, warn, error etc
 */
export const getLogLevel = () => {
  return idx(process, _ => _.env.winstonLogLevel) || 'info'
}

/**
 * How to show the logs .
 * Values: simple or json
 */
export const getLogFormat = () => {
  return idx(process, _ => _.env.winstonLogStyle) || 'simple'
}
/**
 * Available values: docker & kubernetes && kubernetesWatch && dockerWatch
 */
export const runtime = () => {
  return idx(process, _ => _.env.qglProxyRuntime) || 'dockerWatch'
}

/**
 * Starting Slaves for each CPU
 */
export const getEnableClustering = () => {
  return idx(process, _ => _.env.enableClustering) === 'true' || false
}

/**
 * true or false (false  = default)
 * If a backend is not reachable anymore the schema will be allready known
 * WIP Not produktionable
 */
export const knownOldSchemas = () => {
  return idx(process, _ => _.env.gqlProxyKnownOldSchemas) === 'true' || false
}

export const kubernetesConfigurationKind = () => {
  // $kubernetesConfigurationKind
  /**
   * fromKubeconfig, getInCluster, getInClusterByUser
   */
  return idx(process, _ => _.env.kubernetesConfigurationKind) || 'fromKubeconfig'
}

export const k8sUser = () => {
  return idx(process, _ => _.env.gqlProxyK8sUser) || ''
}

export const k8sUserPassword = () => {
  return idx(process, _ => _.env.gqlProxyK8sUserPassword) || ''
}

export const getResetEndpointTime = () => {
  return idx(process, _ => _.env.gqlProxyPollingMs) || 3600000
}

export const getPollingMs = () => {
  return idx(process, _ => _.env.gqlProxyPollingMs) || 5000
}

export const adminUser = () => {
  return idx(process, _ => _.env.gqlProxyAdminUser) || ''
}

export const adminPassword = () => {
  return idx(process, _ => _.env.gqlProxyAdminPassword) || ''
}

export const showPlayground = () => {
  if (idx(process, _ => _.env.gqlShowPlayground) === null) {
    return true
  }
  return idx(process, _ => _.env.gqlShowPlayground) === 'true'
}

export const getBodyParserLimit = () => {
  return idx(process, _ => _.env.gqlBodyParserLimit) || '1mb'
}

/**
 * The Key to active the ApolloEngine
 */
export const getApolloEngineApiKey = (): string => {
  return idx(process, _ => _.env.gqlApolloEngineApiKey) || ''
}

/**
 * boolean if true client can see the structure if false no introspection will be send
 * Only for /grapghql
 * for /admin/graphql intospection will always send
 * default true
 */
export const sendIntrospection = (): boolean => {
  if (idx(process, _ => _.env.sendIntrospection) === null) {
    return true
  }
  return idx(process, _ => _.env.sendIntrospection) === 'true'
}

export const printAllConfigs = () => {
  console.log('===================================')
  console.log('LogLevel:', getLogLevel())
  console.log('qglProxyRuntime:', runtime())
  console.log('gqlProxyPollingMs:', getPollingMs())
  console.log('gqlProxyAdminUser:', adminUser())
  console.log('gqlProxyKnownOldSchemas', knownOldSchemas())
  console.log('gqlShowPlayground', showPlayground())
  console.log('sendIntrospection:', sendIntrospection())
  console.log('Version: ', getVersion())
  console.log('Buildnumber: ', getBuildNumber())
  console.log('gqlProxyToken:', token())
  if (getApolloEngineApiKey() !== '') {
    console.log('gqlApolloEngineApiKey:', getApolloEngineApiKey())
  }
  if (runtime() === 'docker' || runtime() === 'dockerWatch') {
    console.log('dockerNetwork:', network())
  } else if (runtime() === 'kubernetes' || runtime() === 'kubernetesWatch') {
    console.log('kubernetesConfigurationKind:', kubernetesConfigurationKind())
    if (kubernetesConfigurationKind() === 'getInClusterByUser') {
      console.log('gqlProxyK8sUser:', k8sUser())
      console.log('gqlProxyK8sUserPassword:', '********')
    }
  }
  console.log('===================================')
}
