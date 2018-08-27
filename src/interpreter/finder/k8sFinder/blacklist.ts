let data = []

export const addNamespaceToBlacklist = (name) => {
  data.push(name)
}

export const isNamespaceAtBlacklist = (name) => {
  for (const one in data) {
    if (data[one] === name) {
      return true
    }
  }
  return false
}

export const clearAll = () => {
  data = []
}

export const getBlacklist = () => {
  return data
}
