class FindEndpoints{

  constructor(){}
  getEndpoints = () => {
    console.log('you have to override it')
  }

  /**
   * If getEndpoints have different to the past here you can do extra handling like loadbalacing etc... 
   */
  handleRestart = (endpoints) => {
    return endpoints
  }

}

export { FindEndpoints }
