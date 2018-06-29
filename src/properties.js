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
