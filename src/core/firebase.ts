import serviceAccount from './firebase.json'
import * as Firebase from 'firebase-admin'

import DecodedIdToken = Firebase.auth.DecodedIdToken

export class FirebaseApp {
    private db: FirebaseFirestore.Firestore
    private auth: Firebase.auth.Auth

    constructor() {
        if (!Firebase.apps?.length) {
            try {
                Firebase.initializeApp({
                    credential: Firebase.credential.cert(serviceAccount as any)
                })
            } catch (e) {
                console.error(e)
            }
        }

        this.auth = Firebase.auth()
    }

    public async generateClientToken(uid: string, customClaims?: undefined | any): Promise<string> {
        if (customClaims === undefined) return this.auth.createCustomToken(uid)
        return this.auth.createCustomToken(uid, customClaims)
    }

    public async validateClientToken(token: string): Promise<DecodedIdToken> {
        return this.auth.verifyIdToken(token, true)
    }
}
