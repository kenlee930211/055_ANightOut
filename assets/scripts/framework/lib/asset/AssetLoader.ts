/**
 * cc.assetManager loader with Promise, but this method will lose the loading progress
 */
export default class AssetLoader {
    static loadBundle(bundleName: string, options?: Record<string, any>): Promise<cc.AssetManager.Bundle> {
        return new Promise<cc.AssetManager.Bundle>((resolve, reject) => {
            cc.assetManager.loadBundle(bundleName, options, (error: Error, bundle: cc.AssetManager.Bundle) => {
                error ? reject(error) : resolve(bundle);
            });
        });
    }
}
