const { ccclass, property } = cc._decorator;

class ParticlesExtra {
    static cachedFreezeUpdate;

    static freeze(pa: cc.ParticleSystem) {
        this.cachedFreezeUpdate = Object.assign(pa['lateUpdate']);
        pa['lateUpdate'] = function () {
            return;
        };
    }

    static unfreeze(pa: cc.ParticleSystem) {
        pa['lateUpdate'] = this.cachedFreezeUpdate;
    }
}

interface Main {
    coinParticle: cc.ParticleSystem;
    coinParticleAnimation: cc.Animation;
}

@ccclass
export default class CoinRainPrefab extends cc.Component {
    @property
    coinParticleAnimationName: string = null;

    private main: Main = {
        coinParticle: null,
        coinParticleAnimation: null,
    };

    onLoad() {
        this.cacheCoinRainPorperty();
    }

    start() {}

    onEnable() {
        this.playCoinSpreadAnimation();
    }

    onDisable() {
        this.stopCoinSpreadAnimation();
    }

    private cacheCoinRainPorperty() {
        this.main.coinParticle = this.node.getComponent(cc.ParticleSystem);
        this.main.coinParticleAnimation = this.node.getComponent(cc.Animation);
    }

    private playCoinSpreadAnimation() {
        if (this.coinParticleAnimationName) {
            this.main.coinParticleAnimation.play(this.coinParticleAnimationName);
        }
    }

    private stopCoinSpreadAnimation() {
        if (this.coinParticleAnimationName) {
            this.main.coinParticleAnimation.stop();
        }

        this.main.coinParticle.resetSystem();
    }
}
