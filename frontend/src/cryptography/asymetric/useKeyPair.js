import React, { useState } from 'react'
import { useUserContext } from '@/hooks/useUserContext';

const useKeyPair = () => {
    const { userKeyPair } = useUserContext();
    const [isLoading, setIsLoadinng] = useState(false);
    const [error, setError] = useState(null);

    const createRSAKeyPairForKeyWrapping = async () => {
        setIsLoadinng(false);
        setError(null);

        try {
            const RSAKey = {
                name: "RSA-OAEP",
                modulusLength: 4096,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            };

            const keyPair = await crypto.subtle.generateKey(
                RSAKey,
                false,
                ["wrapKey", "unwrapKey"] // Used for encrypting symmetric keys
            );

            userKeyPair.current.publicKey = keyPair.publicKey;
            userKeyPair.current.privateKey = keyPair.privateKey;

            const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey); // Export public key. TODO: Encrypt private key and only then export

            return {success: true, publicKey: publicKey}
        } catch (err) {
            setError(err);
            return { success: false}
        } finally {
            setIsLoadinng(false);
        }
    }



    return { createRSAKeyPairForKeyWrapping, isLoading, error }

}

export default useKeyPair
