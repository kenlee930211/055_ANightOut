// reference https://www.bbsmax.com/A/MyJx7gGazn/

import { gg } from '../../../../scripts/framework/gg';
import { ReelStatus } from '../../slot-engine/SlotEngineEnum';
import SlotEngineModule from '../../slot-engine/SlotEngineModule';

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
export default class HUDSwipeDetectorComponent extends cc.Component {
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

    private firstX = null;
    private firstY = null;
    private swipeResult: SwipeResult = {
        swipeDirection: '',
        swipeDistance: 0,
    };

    onLoad() {}

    start() {
        this.registerEvent();
    }

    getSwipeResult() {
        return this.swipeResult;
    }

    registerEvent() {
        this.node.on(
            cc.Node.EventType.TOUCH_START,
            (event: cc.Event.EventTouch, eventcustom: cc.Event.EventCustom) => {
                // Get node coordinates
                const location = event.getLocation();

                this.firstX = location.x;
                this.firstY = location.y;

                this.swipeResult = {
                    swipeDirection: '',
                    swipeDistance: 0,
                };
            },
            this
        );

        this.node.on(
            cc.Node.EventType.TOUCH_END,
            (event: cc.Event.EventTouch, eventcustom: cc.Event.EventCustom) => {
                let hudprefab = this.node.parent.getComponent('HUDPrefab');
                if (hudprefab.main.btnSpin.enabled == false) return;

                const touchPoint = event.getLocation();
                const endX = this.firstX - touchPoint.x;
                const endY = this.firstY - touchPoint.y;
                const swipeDistance = Math.sqrt(endX * endX + endY * endY);

                let swipeDirection = null;

                if (swipeDistance < this.minSwipeDistance) {
                    // check if spin button is active
                    let count = 0;
                    for (const ele of this.node.children) {
                        // spin reel only if its not blocked
                        if (SlotEngineModule.data.reelsStatus[count].status == ReelStatus.Idle) {
                            // check if user tap inside boundingbox of any reel button
                            if (ele.getBoundingBoxToWorld().contains(event.getStartLocation()) && ele.getBoundingBoxToWorld().contains(touchPoint)) {
                                gg.eventManager.emit('HUDPrefab.TriggerBtnReelClick', null, count);
                                return;
                            }
                        }
                        count++;
                    }
                    return;
                }

                if (Math.abs(endX) > Math.abs(endY)) {
                    // Gesture left and right
                    // Judge left or right
                    if (endX > 0) {
                        // Left function
                        swipeDirection = SwipeDirection.Left;
                        // console.log('left');
                    } else {
                        // Right function
                        swipeDirection = SwipeDirection.Right;
                        // console.log('right');
                    }
                } else {
                    // Gesture up and down
                    // Determine whether the gesture is up or down
                    if (endY > 0) {
                        // Down function
                        swipeDirection = SwipeDirection.Down;
                        // console.log('down');
                    } else {
                        // Up function
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
            },
            this
        );
    }
}
