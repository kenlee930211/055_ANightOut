// reference https://www.bbsmax.com/A/MyJx7gGazn/

const { ccclass, property } = cc._decorator;

enum SwipeDirection {
    Left = 'Left',
    Right = 'Right',
    Up = 'Up',
    Down = 'Down',
}

interface SwipeResult {
    swipeDirection: string;
    swipeDistance: number;
}

@ccclass
export default class SwipeDetectorComponent extends cc.Component {
    @property({
        tooltip: 'Min Swipe Distance',
    })
    minSwipeDistance: number = 100;

    @property({
        tooltip: 'When swipe left will trigger callback bellow',
    })
    swipeLeft: boolean = false;

    @property({
        tooltip: 'When swipe right will trigger callback bellow',
    })
    swipeRight: boolean = false;

    @property({
        tooltip: 'When swipe Up will trigger callback bellow',
    })
    swipeUp: boolean = false;

    @property({
        tooltip: 'When swipe Down will trigger callback bellow',
    })
    swipeDown: boolean = false;

    @property({
        type: cc.Component.EventHandler,
        tooltip: 'Callback Function When Swipe Detector',
    })
    callBack: cc.Component.EventHandler = null;

    @property({
        tooltip: 'Disable cc.Button on same Node to avoid duplicate callback when Swipe Detector event emit.',
    })
    disableCCButtons: boolean = true;

    private firstX = null;
    private firstY = null;
    private ccButtons: cc.Button[] = [];
    private swipeResult: SwipeResult = {
        swipeDirection: '',
        swipeDistance: 0,
    };

    onLoad() {
        this.cacheCCbuttons();

        this.registerEvent();
    }

    start() {}

    getSwipeResult() {
        return this.swipeResult;
    }

    registerEvent() {
        this.node.on(
            cc.Node.EventType.TOUCH_START,
            (event: cc.Event.EventTouch) => {
                // 获取节点坐标
                const location = event.getLocation();

                this.firstX = location.x;
                this.firstY = location.y;

                this.swipeResult = {
                    swipeDirection: '',
                    swipeDistance: 0,
                };

                // 获取触点在空间节点上的坐标
                // var tempPlayer = node.parent.convertToNodeSpaceAR(location);
                // node.setPosition(tempPlayer);
            },
            this
        );

        this.node.on(
            cc.Node.EventType.TOUCH_END,
            (event: cc.Event.EventTouch) => {
                const touchPoint = event.getLocation();
                const endX = this.firstX - touchPoint.x;
                const endY = this.firstY - touchPoint.y;
                const swipeDistance = Math.sqrt(endX * endX + endY * endY);

                let swipeDirection = null;

                // var tempPlayer = node.parent.convertToNodeSpaceAR(touchPoint);
                // node.setPosition(tempPlayer);

                if (swipeDistance < this.minSwipeDistance) {
                    return;
                }

                this.disableCCbuttons();

                if (Math.abs(endX) > Math.abs(endY)) {
                    // 手势向左右
                    // 判断向左还是向右
                    if (endX > 0) {
                        // 向左函数
                        swipeDirection = SwipeDirection.Left;
                        // console.log('left');
                    } else {
                        // 向右函数
                        swipeDirection = SwipeDirection.Right;
                        // console.log('right');
                    }
                } else {
                    // 手势向上下
                    // 判断手势向上还是向下
                    if (endY > 0) {
                        // 向下函数
                        swipeDirection = SwipeDirection.Down;
                        // console.log('down');
                    } else {
                        // 向上函数
                        swipeDirection = SwipeDirection.Up;
                        // console.log('up');
                    }
                }

                this.swipeResult = {
                    swipeDirection: swipeDirection,
                    swipeDistance: swipeDistance,
                };

                if (this.swipeLeft && this.swipeResult.swipeDirection === SwipeDirection.Left) {
                    this.callBack.emit([this.callBack.customEventData]);
                } else if (this.swipeRight && this.swipeResult.swipeDirection === SwipeDirection.Right) {
                    this.callBack.emit([this.callBack.customEventData]);
                } else if (this.swipeUp && this.swipeResult.swipeDirection === SwipeDirection.Up) {
                    this.callBack.emit([this.callBack.customEventData]);
                } else if (this.swipeDown && this.swipeResult.swipeDirection === SwipeDirection.Down) {
                    this.callBack.emit([this.callBack.customEventData]);
                }

                this.enableCCbuttons();
            },
            this
        );
    }

    private cacheCCbuttons() {
        if (this.disableCCButtons) {
            this.ccButtons = this.node.getComponents(cc.Button);
        }
    }

    private enableCCbuttons() {
        for (const ccButton of this.ccButtons) {
            ccButton.enabled = true;
        }
    }

    private disableCCbuttons() {
        for (const ccButton of this.ccButtons) {
            ccButton.enabled = false;
        }
    }
}
