import { Endpoints } from '../endpoints'
import { Interpreter } from '../Interpreter'
class FindEndpoints extends Interpreter{

  constructor() {
    super()
  }
  getEndpoints = (): Promise<Endpoints> => {
    winston.error('you have to override getEndpoints')
    return Promise.resolve({})
  }

  /**
   * If getEndpoints have different to the past
   * here you can do extra handling like loadbalacing etc...
   */
  handleRestart = (endpoints: Endpoints) : Promise<Endpoints> => {
    return Promise.resolve(endpoints)
  }

}

export { FindEndpoints }
