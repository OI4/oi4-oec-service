export interface IParsedTopic {
  levelCount: number;
  topicArray: string[];
}

export interface ISubTopicArray {
  [key: string]: object;
}

export class TopicParser {
  private parsedTopic: IParsedTopic;
  constructor() {
    this.parsedTopic = {
      levelCount: 0,
      topicArray: [],
    };
  }

  static retrieveTopicLevels(topic: string): IParsedTopic {
    const parsedTopic: IParsedTopic = {
      levelCount: 0,
      topicArray: [],
    };
    parsedTopic.topicArray = topic.split('/');
    parsedTopic.levelCount = parsedTopic.topicArray.length;
    return parsedTopic;
  }

}
