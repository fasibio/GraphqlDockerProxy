export class Namespaces {
  namespaceNames = {}
  constructor() {
  }

  isNameExist = (name) => {
    return this.namespaceNames[name] !== undefined
  }

  addNameToList = (name, value) => {
    this.namespaceNames[name] = value
  }

  getList = () => {
    return this.namespaceNames
  }

  hasAllInList = (list) => {
    if (list.length < Object.keys(this.namespaceNames).length) {
      return false
    }
    for (const one in list) {
      const oneItem = list[one]
      if (!this.isNameExist(oneItem)) {
        return false
      }
    }
    return true
  }

  addAllToList = (list, value) => {
    for (const one in list) {
      const oneItem = list[one]
      this.addNameToList(oneItem, value)
    }
  }

  clear = () => {
    this.namespaceNames = {}
  }

}
