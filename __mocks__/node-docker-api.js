export class Docker{
  constructor(){
  }

  containers = [
    {
      data: {
        Labels: {
          'gqlProxy.token': 1234,
          'gqlProxy.url': ':9000/graphql',
          'gqlProxy.namespace': 'one',
        },
        Created: '20180101',
        Image: 'one',
        NetworkSettings: {
          Networks: {
            web: {
              IPAddress: '123.122.123.123',
            },
          },
        },
      },
    },
    {
      data: {
        Labels: {},
        NetworkSettings: {
          Networks: {
            web: {
              IPAddress: '123.122.123.123',
            },
          },
        },
      },
    },
    {
      data: {
        Labels: {
          'gqlProxy.token': 1234,
          'gqlProxy.url': ':9000/graphql',
          'gqlProxy.namespace': 'two',
        },
        Created: '20180101',
        Image: 'two',
        NetworkSettings: {
          Networks: {
            web: {
              IPAddress: '123.122.123.123',
            },
          },
        },
      },
    },
    {
      data: {
        Labels: {
          'gqlProxy.token': 1234,
          'gqlProxy.url': ':9000/graphql',
          'gqlProxy.namespace': 'two',
        },
        Created: '20180101',
        Image: 'twoTWO',
        NetworkSettings: {
          Networks: {
            web: {
              IPAddress: '123.122.123.123',
            },
          },
        },
      },
    },
  ]

  container = {
    list: () => Promise.resolve(this.containers),
  }

}
