export const network = () => {
  return process.env.dockerNetwork
}

export const token = () => {
  return idx(process, _ => _.env.gqlProxyToken) || ''
}
