@supabase_supabase-js.js?v=d7616bf2:11405  POST https://pgcvzbihzftpcxxckuvq.supabase.co/rest/v1/trips?columns=%22trip_name%22%2C%22client_id%22%2C%22client_name%22%2C%22destination%22%2C%22start_date%22%2C%22end_date%22%2C%22travelers%22%2C%22budget%22%2C%22mood%22%2C%22stage%22%2C%22notes%22%2C%22lost_reason%22&select=* 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=d7616bf2:11405
(anonymous) @ @supabase_supabase-js.js?v=d7616bf2:11419
await in (anonymous)
then @ @supabase_supabase-js.js?v=d7616bf2:269Understand this error
supabaseClient.js:97 Error creating trips: {code: '23502', details: 'Failing row contains (66ce3af8-3b61-4bb9-9d86-5b52…null, null, Luna de miel, 1, Romantico, nuevo, ).', hint: null, message: 'null value in column "created_by" of relation "trips" violates not-null constraint'}