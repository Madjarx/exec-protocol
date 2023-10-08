import { NodeProperties, Red } from "node-red";
import { Node } from "./Node";


module.exports = function(RED: Red) {
  class RubymineNode extends Node {
    constructor(config: NodeProperties) {
      super(RED);

      this.createNode(config);

      this.on("input", (msg: any) => {
        msg.payload = msg.payload.toLowerCase();
        this.send(msg);
      });
    }
  }

  RubymineNode.registerType(RED, "node-rubymine");
};