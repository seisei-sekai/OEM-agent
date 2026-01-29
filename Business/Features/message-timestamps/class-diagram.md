```mermaid
classDiagram
  class Message {
    <<Entity>>
    +id: string
    +method()
  }


  class Timestamp {
    <<Value Object>>
    -value: unknown
    +equals(other)
  }

```