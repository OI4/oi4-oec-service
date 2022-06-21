export class Oi4IdManager {

    private static currentOi4IdContainer: {oi4Id: string} = undefined;

    public static saveCurrentOi4Id(oi4Id: string) {
        if(oi4Id === undefined || oi4Id.length === 0) {
            throw new Error('Invalid oi4Id: either undefined or empty.');
        }
        Oi4IdManager.currentOi4IdContainer = {oi4Id : oi4Id};
    }

    public static fetchCurrentOi4Id(): string {
        if(this.currentOi4IdContainer === undefined) {
            throw new Error('Currently there is no oi4Id saved.');
        }

        return Oi4IdManager.currentOi4IdContainer.oi4Id;
    }

    public static resetCurrentOi4Id() {
        Oi4IdManager.currentOi4IdContainer = undefined;
    }

}