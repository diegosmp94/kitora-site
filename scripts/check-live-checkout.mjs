import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const cart = readFileSync('cart.js','utf8');
const page = readFileSync('panier.html','utf8');
const account = readFileSync('compte.html','utf8');
const requests = readFileSync('subscriber-requests.js','utf8');
assert.match(cart, /create-checkout-live/, 'LIVE route must be defined for future deployment');
assert.match(cart, /const isLive=false;/, 'Release gate must disable LIVE payments before end-to-end validation');
assert.match(cart, /create-checkout/, 'TEST checkout route is missing');
assert.match(cart, /plus_monthly/);
assert.match(cart, /plus_yearly/);
assert.match(account, /customer-portal-live/, 'LIVE billing portal route is missing');
assert.match(page, /Stripe TEST/, 'TEST checkout disclosure is missing');
assert.match(page, /aucun prélèvement réel/, 'TEST mode disclaimer is missing');
assert.doesNotMatch(cart, /sk_live_|rk_live_|whsec_/, 'Never put Stripe secrets in client code');
console.log('Kitora LIVE checkout static integration checks passed');

assert.match(account, /kitora_live_subscriptions/, 'Account must fetch LIVE subscription state');
assert.match(requests, /kitora_live_subscriptions/, 'Premium requests must accept verified LIVE subscriptions');
