/*
 * This seed file inserts test wallets into the database to test wallet migrations.
 * Only the wallets for which we could hardcode the configuration when this file was created will work to send or receive zaps.
 * For example, NWC won't work for send or receive because it generates a random public key and secret every time the container is started for the first time.
 */

-- device sync passphrase: media fit youth secret combine live cupboard response enable loyal kitchen angle
COPY public."users" ("id", "name", "vaultKeyHash") FROM stdin;
21001	test_wallet_v2	0feb0e0ed8684eaf37a995c4decac6d360125d40ff3fffe26239bb7ffd810853
\.

-- triggers will update the wallet JSON column in the Wallet table when we insert rows into the other wallet tables
COPY public."Wallet" ("id", "userId", "type", "enabled") FROM stdin;
1	21001	LIGHTNING_ADDRESS	true
2	21001	NWC	true
3	21001	WEBLN	true
4	21001	LNBITS	true
5	21001	CLN	true
6	21001	BLINK	true
7	21001	PHOENIXD	true
8	21001	LND	true
9	21001	LNC	true
10	21001	LIGHTNING_ADDRESS	true
11	21001	LIGHTNING_ADDRESS	true
12	21001	LIGHTNING_ADDRESS	true
13	21001	LIGHTNING_ADDRESS	true
14	21001	LIGHTNING_ADDRESS	true
15	21001	LIGHTNING_ADDRESS	true
16	21001	LIGHTNING_ADDRESS	true
17	21001	LIGHTNING_ADDRESS	true
18	21001	LIGHTNING_ADDRESS	true
19	21001	LIGHTNING_ADDRESS	true
20	21001	LIGHTNING_ADDRESS	true
21	21001	LIGHTNING_ADDRESS	true
22	21001	LIGHTNING_ADDRESS	true
23	21001	LIGHTNING_ADDRESS	true
24	21001	LIGHTNING_ADDRESS	true
25	21001	LIGHTNING_ADDRESS	true
26	21001	LIGHTNING_ADDRESS	true
27	21001	LIGHTNING_ADDRESS	true
28	21001	NWC	true
29	21001	NWC	true
\.

COPY public."WalletLightningAddress" ("id", "walletId", "address") FROM stdin;
1	1	john_doe@getalby.com
2	10	john_doe@rizful.com
3	11	john_doe@fountain.fm
4	12	john_doe@primal.net
5	13	john_doe@coinos.io
6	14	john_doe@speed.app
7	15	john_doe@tryspeed.com
8	16	john_doe@blink.sv
9	17	john_doe@zbd.gg
10	18	john_doe@strike.me
11	19	john_doe@minibits.cash
12	20	john_doe@npub.cash
13	21	john_doe@zeuspay.com
14	22	john_doe@fountain.fm
15	23	john_doe@lifpay.me
16	24	john_doe@rizful.com
17	25	john_doe@vlt.ge
19	26	john_doe@blixtwallet.com
20	27	john_doe@shockwallet.app
\.

COPY public."WalletNWC" ("id", "walletId", "nwcUrlRecv") FROM stdin;
1	2	nostr+walletconnect://8682ce552a852b5e21c8fe1235823a6f175641538f4c5431ec559a75dfb7f73a?relay=wss://relay.getalby.com/v1&secret=99669866becdbfacef4e9c3f0d00f085ee1174bc973135f158bab769f37152b9&lud16=john_doe@getalby.com
2	28	nostr+walletconnect://8682ce552a852b5e21c8fe1235823a6f175641538f4c5431ec559a75dfb7f73a?relay=wss://relay-nwc.rizful.com&secret=99669866becdbfacef4e9c3f0d00f085ee1174bc973135f158bab769f37152b9
\.

COPY public."WalletLNbits" ("id", "walletId", "url", "invoiceKey") FROM stdin;
1	4	http://localhost:5001	5deed7cd634e4306bb5e696f4a03cdac
\.

COPY public."WalletCLN" ("id", "walletId", "socket", "rune", "cert") FROM stdin;
1	5	cln:3010	Fz6ox9zLwTRfHSaKbxdr5SK4KyxAjL_UEniED6UEGRw9MCZtZXRob2Q9aW52b2ljZQ==	LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tDQpNSUlCY2pDQ0FSaWdBd0lCQWdJSkFOclN2UFovWTNLRU1Bb0dDQ3FHU000OUJBTUNNQll4RkRBU0JnTlZCQU1NDQpDMk5zYmlCU2IyOTBJRU5CTUNBWERUYzFNREV3TVRBd01EQXdNRm9ZRHpRd09UWXdNVEF4TURBd01EQXdXakFXDQpNUlF3RWdZRFZRUUREQXRqYkc0Z1VtOXZkQ0JEUVRCWk1CTUdCeXFHU000OUFnRUdDQ3FHU000OUF3RUhBMElBDQpCQmptYUh1dWxjZ3dTR09ubExBSFlRbFBTUXdHWEROSld5ZnpWclY5aFRGYUJSZFFrMVl1Y3VqVFE5QXFybkVJDQpyRmR6MS9PeisyWFhENmdBMnhPbmIrNmpUVEJMTUJrR0ExVWRFUVFTTUJDQ0EyTnNib0lKYkc5allXeG9iM04wDQpNQjBHQTFVZERnUVdCQlNFY21OLzlyelMyaFI2RzdFSWdzWCs1MU4wQ2pBUEJnTlZIUk1CQWY4RUJUQURBUUgvDQpNQW9HQ0NxR1NNNDlCQU1DQTBnQU1FVUNJSENlUHZOU3Z5aUJZYXdxS2dRcXV3OUoyV1Z5SnhuMk1JWUlxejlTDQpRTDE4QWlFQWg4QlZEejhwWDdOc2xsOHNiMGJPMFJaNDljdnFRb2NDZ1ZhYnFKdVN1aWs9DQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tDQo=
\.

COPY public."WalletBlink" ("id", "walletId", "apiKeyRecv", "currencyRecv") FROM stdin;
1	6	blink_IpGjMEmlLZrb3dx1RS5pcVm7Z6uKthb2UMg5bfGxcIV4Yae	BTC
\.

COPY public."WalletPhoenixd" ("id", "walletId", "url", "secondaryPassword") FROM stdin;
1	7	https://phoenixd.ekzy.is	abb6dc487e788fcfa2bdaf587aa3f96a5ee4a3e8d7d8068131182c5919d974cd
\.

COPY public."WalletLND" ("id", "walletId", "socket", "macaroon", "cert") FROM stdin;
1	8	lnd:10009	0201036c6e64022f030a1089912eeaa5f434e5265170565bcce0eb1201301a170a08696e766f6963657312047265616412057772697465000006200622e95cf2fe2d9a8976cbfb824809a9a5e8af861b659e396064f6de1dc79d04	LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNoVENDQWl1Z0F3SUJBZ0lSQUp5Zkg3cEdDZEhXTVJZVGo1d1pKSkF3Q2dZSUtvWkl6ajBFQXdJd09ERWYKTUIwR0ExVUVDaE1XYkc1a0lHRjFkRzluWlc1bGNtRjBaV1FnWTJWeWRERVZNQk1HQTFVRUF4TU1NR1V5T0dVNApPREkzTmpZd01CNFhEVEkxTURZd05URTRNak15TmxvWERUSTJNRGN6TVRFNE1qTXlObG93T0RFZk1CMEdBMVVFCkNoTVdiRzVrSUdGMWRHOW5aVzVsY21GMFpXUWdZMlZ5ZERFVk1CTUdBMVVFQXhNTU1HVXlPR1U0T0RJM05qWXcKTUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0RRZ0FFUE1lb2RYYTF2eXVxYXFaNklXbXgrNDVFdjBkUgpmQkY5SXZtMU5xQVNHUGlGT1JucEtxZVBVbm0xWmZlTUNETytwcGhQMHpGYVh4ZVBUU3BwaWMrYXlLT0NBUlF3CmdnRVFNQTRHQTFVZER3RUIvd1FFQXdJQ3BEQVRCZ05WSFNVRUREQUtCZ2dyQmdFRkJRY0RBVEFQQmdOVkhSTUIKQWY4RUJUQURBUUgvTUIwR0ExVWREZ1FXQkJUYkdKMlZDejN5WkFUd1JlUG1kckdvMnhkVmFqQ0J1QVlEVlIwUgpCSUd3TUlHdGdnd3daVEk0WlRnNE1qYzJOakNDQ1d4dlkyRnNhRzl6ZElJRGJHNWtnaFJvYjNOMExtUnZZMnRsCmNpNXBiblJsY201aGJJSStOelV5ZUdWNWIyeG1jSEJqTW5SbloybDZaSEZoYW1Kb2VXZHNjRzV4ZW10bGFtVmoKWW1oeGJIQnpNMjU0ZW5aMGMyZzNkMkZ0Y1dRdWIyNXBiMjZDQkhWdWFYaUNDblZ1YVhod1lXTnJaWFNDQjJKMQpabU52Ym02SEJIOEFBQUdIRUFBQUFBQUFBQUFBQUFBQUFBQUFBQUdIQkt3U0FBY3dDZ1lJS29aSXpqMEVBd0lEClNBQXdSUUlnY2pZZ2o5YVhpQjlOOVBmQUp0cWZRbStoYVdpbmZ0RTVXdkJ3Vis4NzgzTUNJUUNyaEx2Qys3RzQKN3NneENyYnlmLy9WdmxJN3BkakRlVFM0WGc4eHB2UmVEQT09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K
\.

COPY public."VaultEntry" ("id", "key", "iv", "value", "userId", "walletId") FROM stdin;
1	nwcUrl	926622f7139d4b4506827549	b592906ea9c3ced5df077ca1ea0c787c2ea9173e39d062466b50723d8c0a568510ed42549215c6f6e15632601248f148fa18b87d7e0fe9ad667d10a12beb79e36d3cfcaa58ca65c78e8f41ee715c2b19ac8c638353cdc9098a784104eb9b1592b233d4327556de47d218f97991392105ff0868beada2667b308d544bf9e7199f056ecb8cd9c2f87a7f8f1eda7db7e80c880de12df4ce2dc5dcc16ec836d9a9f428f2c4e36f01bdbbd85084ecac308eefa1dbdfe89c2a321a3fafa1c35265a788a352c329f9e01d0988e47f05b8575fbcfb5814	21001	2
2	adminKey	1b911294853df2e94e4d9823	438ff80df2e58e3f7988ba828fab1e7def3934b908a58de9f5f16bb36e1ecc65e1cab43c0ec658f65bdccb0a241bb5614697	21001	4
3	apiKey	b1f3500130b16bf4997fc370	3276869cf3d8c6d844e771688f8cd1a771279867165e4b1030b7ad90d537d5cfa0a6a82c2aaefe350db2a445b3b0c3b23a068edede3e78fe5957c1cfc6b5f1fd811786793c65aad90fe8ce	21001	6
4	currency	8174fe225f0d53957a4daced	b912faacc32725b9ec01128911eb3922822fb21bdc	21001	6
5	primaryPassword	5e709c93ca34a135dad293d7	7509592ff463f886b7f7a621928a8ac0ca56b904d5835bf77ca5914a248fb70ad231f04aed893c0ef1dd7edd2d928d482d0eaeba7ae2381f3fd70ba25cb265de6091a11231a9cd3047f22ff2f838db046e67	21001	7
6	pairingPhrase	0196718758dea2bff7c89741	bd6ff716ec5b20dc74f6507b87ed0923c8b27e33204ae44cee47d8c7f78dd5976cc446f2c9dd918f2916611a71e20e87fb9245cacfdb35bbc527a42c0df765e2f9589e56b5b253c0d39f8e954b	21001	9
7	localKey	227bc46af405a40cb6697344	f4589aaca476b4905980b9dd834880926aff9e9c9217afa9b33152a74255698c9284015309ae19e10481843069a052dbe1a592e14db6aa13fce4e17fd9f5f2964720ba4686a4a45a1c72681248809e8de612	21001	9
8	remoteKey	e63b62d8af6a1227129e8c7b	ce97d971cdcd58b34ec2e998c6ce6df72b8c21a9cd07e69db96c9491b3d9a051cf557d721552c5cc565a4d7f1bf1ad70b20048b90e1b244e77f0b635b5dbd798e0538f85d7008b29918a7e589dc1c2bde465c50c	21001	9
9	serverHost	a537d212e719810f6cbbc696	449c550ca2c24e761802087e5bc5637d0b4b231d9b771fbefbee6ed7c0a728862adc677cc283a373ec25f01003009f0c9cd18f884d08	21001	9
\.

COPY public."Invoice" ("id", "userId", "hash", "bolt11", "expiresAt", "msatsRequested") FROM stdin;
1	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82a1	lnbc	2025-05-16 00:00:00	1000000
2	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82a2	lnbc	2025-05-16 00:00:00	2000000
3	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82a3	lnbc	2025-05-16 00:00:00	3000000
4	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82a4	lnbc	2025-05-16 00:00:00	4000000
5	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82a5	lnbc	2025-05-16 00:00:00	1000000
6	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82a6	lnbc	2025-05-16 00:00:00	2000000
7	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82a7	lnbc	2025-05-16 00:00:00	3000000
8	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82a8	lnbc	2025-05-16 00:00:00	4000000
9	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82a9	lnbc	2025-05-16 00:00:00	4000000
10	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82aa	lnbc	2025-05-16 00:00:00	4000000
11	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82ab	lnbc	2025-05-16 00:00:00	4000000
12	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82ac	lnbc	2025-05-16 00:00:00	4000000
13	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82ad	lnbc	2025-05-16 00:00:00	4000000
14	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82ae	lnbc	2025-05-16 00:00:00	4000000
15	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb82af	lnbc	2025-05-16 00:00:00	4000000
16	21001	d1bc8d3ba4afc7e109612cb73acbdddac052c93025aa1f82942edabb7deb8210	lnbc	2025-05-16 00:00:00	4000000
\.

COPY public."Withdrawl" ("id", "userId", "walletId", "msatsPaying", "msatsFeePaying") FROM stdin;
1	21001	1	1000	0
2	21001	2	1000	0
3	21001	2	1000	0
4	21001	5	1000	0
5	21001	5	1000	0
6	21001	6	1000	0
7	21001	7	1000	0
8	21001	7	1000	0
9	21001	8	1000	0
10	21001	10	1000	0
11	21001	11	1000	0
12	21001	27	1000	0
13	21001	28	1000	0
14	21001	29	1000	0
15	21001	1	1000	0
16	21001	4	1000	0
17	21001	4	1000	0
18	21001	7	1000	0
19	21001	7	1000	0
20	21001	8	1000	0
\.

COPY public."InvoiceForward" ("id", "walletId", "bolt11", "maxFeeMsats", "invoiceId", "withdrawlId") FROM stdin;
1	1	lnbc	1000	1	1
2	2	lnbc	1000	2	2
3	4	lnbc	1000	3	3
4	4	lnbc	1000	4	4
5	5	lnbc	1000	5	5
6	6	lnbc	1000	6	6
7	7	lnbc	1000	7	7
8	8	lnbc	1000	8	8
9	27	lnbc	1000	9	9
10	28	lnbc	1000	10	10
11	29	lnbc	1000	11	11
12	4	lnbc	1000	12	12
13	4	lnbc	1000	13	13
14	5	lnbc	1000	14	14
15	6	lnbc	1000	15	15
16	7	lnbc	1000	16	16
\.

SELECT pg_catalog.setval('public."InvoiceForward_id_seq"', 16, true);

COPY public."DirectPayment" ("id", "walletId", "senderId", "receiverId", "msats") FROM stdin;
1	1	21001	21001	1000
2	2	21001	21001	1000
3	4	21001	21001	1000
4	5	21001	21001	1000
5	6	21001	21001	1000
6	7	21001	21001	1000
7	8	21001	21001	1000
8	16	21001	21001	1000
9	27	21001	21001	1000
10	28	21001	21001	1000
11	29	21001	21001	1000
12	7	21001	21001	1000
13	7	21001	21001	1000
14	5	21001	21001	1000
15	5	21001	21001	1000
16	4	21001	21001	1000
\.

SELECT pg_catalog.setval('public."DirectPayment_id_seq"', 16, true);
