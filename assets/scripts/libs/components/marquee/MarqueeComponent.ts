const { ccclass, property } = cc._decorator;

enum MoveDirection {
    Left = 1,
    Right = 2,
}

@ccclass
export default class MarqueeComponent extends cc.Component {
    @property(cc.Node)
    maskNode: cc.Node = null;

    @property(cc.Node)
    nodeToMove: cc.Node = null;

    @property()
    contentSize: number = 500;

    @property()
    speed: number = 100;

    @property({
        type: cc.Enum(MoveDirection),
        tooltip: 'The direction of Node Moving',
    })
    direction: MoveDirection = MoveDirection.Left;

    private rightEnd = 0;
    private leftEnd = 0;

    start() {
        this.rightEnd = this.node.x + this.maskNode.width * this.maskNode.anchorX;
        this.leftEnd = this.node.x - this.maskNode.width * this.maskNode.anchorX;

        let xPos: number = 0;

        if (this.direction === MoveDirection.Right) {
            xPos = this.leftEnd - this.contentSize;
        } else {
            xPos = this.rightEnd;
        }

        this.nodeToMove.x = xPos;
    }

    update(dt: number) {
        const movingStep = this.speed * dt;

        let smootherStep = movingStep;
        let smootherStepGap = smootherStep / 5;

        if (this.direction === MoveDirection.Right) {
            if (this.nodeToMove.x >= this.rightEnd) {
                this.nodeToMove.x = this.leftEnd - this.contentSize;
            }

            while (smootherStep > 0) {
                this.nodeToMove.x += smootherStepGap;

                smootherStep -= smootherStepGap;
            }
        } else if (this.direction === MoveDirection.Left) {
            if (this.nodeToMove.x <= this.leftEnd - this.contentSize) {
                this.nodeToMove.x = this.rightEnd;
            }

            while (smootherStep > 0) {
                this.nodeToMove.x -= smootherStepGap;

                smootherStep -= smootherStepGap;
            }
        }
    }
}
