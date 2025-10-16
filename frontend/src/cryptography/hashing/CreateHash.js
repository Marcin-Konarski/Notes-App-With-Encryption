import config from "@/cryptography/AWS_Cognito/Config";

const generateHash = async (hashType, messageData) => {
    const clientSecret = import.meta.env.VITE_CLIENT_SECRET;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(clientSecret);    

    const key = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        hashType,
        false,
        ['sign']
    );

    const signature = await window.crypto.subtle.sign(
        hashType.name,
        key,
        messageData
    );

    const hashArray = Array.from(new Uint8Array(signature));
    const hashBinary = hashArray.map(b => String.fromCharCode(b)).join('');
    const secretHash = btoa(hashBinary);

    return secretHash;
};

const generateHMACHash = async (message) => {
    const HmacKeyGenParams = {
        name: 'HMAC',
        hash: 'SHA-256',
    };

    const encoder = new TextEncoder();
    const messageData = encoder.encode(message)
    const HMACHash = await generateHash(HmacKeyGenParams, messageData);

    return HMACHash;
}

const makeCognitoPasswordHash = async (username) => {

    const message = username + config.clientId;

    const hash = await generateHMACHash(message);

    return hash;
}

export { generateHash, makeCognitoPasswordHash }