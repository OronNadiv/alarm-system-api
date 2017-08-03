module.exports = `
type User {
  id: ID!
  name: String!
}

type Ack {
  id: ID!
  requestedBy: User
  createdAt: String!
  updatedAt: String
  sensorName: String!
}

type Motion {
  id: ID!
  requestedBy: User
  createdAt: String!
  updatedAt: String
  sensorName: String!
}

type Toggle {
  id: ID!
  requestedBy: User
  createdAt: String
  updatedAt: String
  isArmed: Boolean!
}

type Query {
  acks(): [Ack]
  motions(count: Int = 20, days: Int = 7): [Motions]
  toggles(count: Int = 20): [Toggle]
}

type Mutation {
  createToggle(isArmed: Boolean!) {
    id: ID!
  }
}
`
