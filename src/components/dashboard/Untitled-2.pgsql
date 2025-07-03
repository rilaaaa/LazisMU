DELETE FROM "JurnalDataPenyalurans";
DELETE FROM "jurnals";
SELECT setval('jurnals_id_seq', 1, false);