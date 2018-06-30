export const network = () => {
  return process.env.dockerNetwork || 'web'
}

export const token = () => {
  return idx(process, _ => _.env.gqlProxyToken) || ''
}

/**
 * Available values: docker & kubernetes
 */
export const runtime = () => {
  return idx(process, _ => _.env.qglProxyRuntime) || 'docker'
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


export const printAllConfigs = () => {
  console.log('===================================')
  console.log('qglProxyRuntime:', runtime())
  console.log('gqlProxyPollingMs:', getPollingMs())
  console.log('gqlProxyAdminUser:', adminUser())
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
