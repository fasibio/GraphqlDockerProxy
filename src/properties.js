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
 * Available values: docker & kubernetes && kubernetesWatch
 */
export const runtime = () => {
  return idx(process, _ => _.env.qglProxyRuntime) || 'docker'
}

/**
 * true or false (false  = default)
 * If a backend is not reachable anymore the schema will be allready known
 * WIP Not produktionable
 */
export const knownOldSchemas = () => {
  return idx(process, _ => _.env.gqlProxyKnownOldSchemas) || false
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
  return idx(process, _ => _.env.gqlShowPlayground) || true
}


export const getBodyParserLimit = () => {
  return idx(process, _ => _.env.gqlBodyParserLimit) || '1mb'
}

export const printAllConfigs = () => {
  console.log('===================================')
  console.log('qglProxyRuntime:', runtime())
  console.log('gqlProxyPollingMs:', getPollingMs())
  console.log('gqlProxyAdminUser:', adminUser())
  console.log('gqlProxyKnownOldSchemas', knownOldSchemas())
  console.log('gqlShowPlayground', showPlayground())
  console.log('Version: ', getVersion())
  console.log('Buildnumber: ', getBuildNumber())
  if (runtime() === 'docker'){
    console.log('dockerNetwork:', network())
    console.log('gqlProxyToken:', token())
  } else if (runtime() === 'kubernetes'){
    console.log('kubernetesConfigurationKind:', kubernetesConfigurationKind())
    if (kubernetesConfigurationKind() === 'getInClusterByUser'){
      console.log('gqlProxyK8sUser:', k8sUser())
      console.log('gqlProxyK8sUserPassword:', '********')
    }
  }
  console.log('===================================')
}
