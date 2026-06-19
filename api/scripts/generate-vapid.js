import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('===================================================');
console.log('VAPID KEYS GENERATED SUCCESSFULLY:');
console.log('===================================================');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('===================================================');
console.log('Copy these to your api/.env file');
console.log('===================================================');
