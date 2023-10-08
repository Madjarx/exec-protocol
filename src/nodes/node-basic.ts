import { NodeProperties, Red } from "node-red";
import { Node } from "./Node";


module.exports = function(RED: Red) {
  class BasicNode extends Node {
    constructor(config: NodeProperties) {
      super(RED);
      const self = this;

      this.createNode(config);

      this.on("input", (msg: any) => {
        msg.payload = msg.payload.toLowerCase();
        this.send(msg);
      });
    }
  }

  BasicNode.registerType(RED, "node-basic");
};
