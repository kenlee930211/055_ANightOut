const { ccclass, property } = cc._decorator;

@ccclass
export default class ContentScaleAdapterComponent extends cc.Component {
    @property({
        multiline: true,
    })
    Noted: string = 'Can remove it, if cause any scaling issues';

    onLoad() {
        this.onResize();
    }

    onEnable() {
        const onResize = this.onResize.bind(this);
        window.addEventListener('resize', onResize);
    }

    onDisable() {
        const onResize = this.onResize.bind(this);
        window.removeEventListener('resize', onResize);
    }

    private onResize() {
        if (this.node) {
            const canvasSize = cc.view.getCanvasSize();
            const visibleSize = cc.view.getVisibleSizeInPixel();

            const ratioWidth = canvasSize.width / visibleSize.width;
            const ratioHeight = canvasSize.height / visibleSize.height;

            if (ratioWidth > ratioHeight) {
                this.node.scaleX = ratioWidth;
                this.node.scaleY = ratioHeight;
            } else {
                this.node.scaleX = ratioWidth;
                this.node.scaleY = ratioHeight;
            }
        }
    }
}
